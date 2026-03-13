/**
 * Route Estimation Service
 *
 * Resolves locations to graph nodes, loads checkpoint constraints (when Feature 1 exists),
 * runs the A* pathfinder, and returns formatted results.
 */

import type { EstimateRouteInput } from "./routes.validation";
import { findNearestNode, findNodeByName, getAllNodes } from "./routes.graph";
import { findRoute, type BoundingBox } from "./routes.pathfinder";
import pool from "../../db/mysql";
import type { RowDataPacket } from "mysql2";

// ─── Resolve a location input to a graph node ID ────────────────────────────

function resolveLocation(loc: { lat?: number; lng?: number; name?: string }): {
    nodeId: string;
    resolvedName: string;
    method: "name" | "coordinates";
} {
    if ("name" in loc && loc.name) {
        const node = findNodeByName(loc.name);
        if (!node) {
            const err: any = new Error(`Location "${loc.name}" not found in the road network`);
            err.status = 404;
            throw err;
        }
        return { nodeId: node.id, resolvedName: node.name, method: "name" };
    }

    if ("lat" in loc && "lng" in loc && loc.lat !== undefined && loc.lng !== undefined) {
        const node = findNearestNode(loc.lat, loc.lng);
        return { nodeId: node.id, resolvedName: node.name, method: "coordinates" };
    }

    const err: any = new Error("Invalid location – provide either { name } or { lat, lng }");
    err.status = 400;
    throw err;
}

// ─── Load active checkpoints from DB (if Feature 1 tables exist) ─────────

async function loadCheckpointNodeIds(): Promise<Set<string>> {
    const nodeIds = new Set<string>();

    try {
        // Check if the checkpoints table exists
        const [tables]: any = await pool.query(
            `SELECT TABLE_NAME FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'checkpoints'`
        );

        if (!tables || tables.length === 0) {
            // Feature 1 not implemented yet – no checkpoints to avoid
            return nodeIds;
        }

        // Load active checkpoints with lat/lng
        const [rows] = await pool.execute<RowDataPacket[]>(
            `SELECT latitude, longitude FROM checkpoints WHERE current_status IN ('closed', 'delayed', 'hazard')`
        );

        for (const row of rows as any[]) {
            const lat = Number(row.latitude);
            const lng = Number(row.longitude);
            if (Number.isFinite(lat) && Number.isFinite(lng)) {
                const nearest = findNearestNode(lat, lng);
                nodeIds.add(nearest.id);
            }
        }
    } catch {
        // Silently handle – table may not exist yet
    }

    return nodeIds;
}

// ─── Main Service Function ──────────────────────────────────────────────────

export async function estimateRoute(input: EstimateRouteInput) {
    // 1. Resolve origin & destination
    const origin = resolveLocation(input.origin as any);
    const destination = resolveLocation(input.destination as any);

    if (origin.nodeId === destination.nodeId) {
        return {
            distance: 0,
            distanceUnit: "km",
            duration: 0,
            durationUnit: "minutes",
            path: [{ ...findNodeByName(origin.resolvedName)! }],
            metadata: {
                algorithm: "A*",
                factors: ["Origin and destination are the same location"],
                roadTypes: [],
                avoidedAreas: 0,
                checkpointsConsidered: 0,
                warnings: [],
            },
        };
    }

    // 2. Build constraints
    const avoidNodes = new Set<string>();
    let checkpointsConsidered = 0;

    if (input.avoidCheckpoints) {
        const cpNodes = await loadCheckpointNodeIds();
        for (const id of cpNodes) {
            // Don't block origin or destination even if checkpoint is there
            if (id !== origin.nodeId && id !== destination.nodeId) {
                avoidNodes.add(id);
            }
        }
        checkpointsConsidered = cpNodes.size;
    }

    const avoidAreas: BoundingBox[] = (input.avoidAreas ?? []).map((a) => ({
        minLat: a.minLat,
        minLng: a.minLng,
        maxLat: a.maxLat,
        maxLng: a.maxLng,
    }));

    // 3. Run pathfinder
    const result = findRoute(origin.nodeId, destination.nodeId, {
        avoidNodes: avoidNodes.size > 0 ? avoidNodes : undefined,
        avoidAreas: avoidAreas.length > 0 ? avoidAreas : undefined,
    });

    if (!result.found) {
        const err: any = new Error("No route found between the specified locations");
        err.status = 404;
        err.details = {
            origin: origin.resolvedName,
            destination: destination.resolvedName,
            factors: result.factors,
        };
        throw err;
    }

    // 4. Build response
    const warnings: string[] = [];
    if (origin.method === "coordinates") {
        warnings.push(`Origin snapped to nearest city: ${origin.resolvedName}`);
    }
    if (destination.method === "coordinates") {
        warnings.push(`Destination snapped to nearest city: ${destination.resolvedName}`);
    }

    return {
        distance: result.distance,
        distanceUnit: "km",
        duration: result.duration,
        durationUnit: "minutes",
        path: result.path.map((n) => ({
            name: n.name,
            lat: n.lat,
            lng: n.lng,
        })),
        metadata: {
            algorithm: "A*",
            factors: result.factors,
            roadTypes: [...result.roadTypes],
            avoidedAreas: avoidAreas.length,
            checkpointsConsidered,
            warnings,
        },
    };
}

// ─── Network info ────────────────────────────────────────────────────────────

export function getNetwork() {
    return getAllNodes().map((n) => ({
        id: n.id,
        name: n.name,
        lat: n.lat,
        lng: n.lng,
        governorate: n.governorate,
    }));
}
