/**
 * A* Pathfinder over the Palestine road graph.
 *
 * Supports constraints:
 *  – avoidNodes: set of node IDs to exclude (e.g. checkpoint locations)
 *  – avoidAreas: bounding boxes; any node inside one is excluded
 */

import {
    ADJACENCY,
    NODES,
    haversineDistance,
    type GraphNode,
    type GraphEdge,
} from "./routes.graph";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BoundingBox {
    minLat: number;
    minLng: number;
    maxLat: number;
    maxLng: number;
}

export interface PathfinderConstraints {
    avoidNodes?: Set<string>;
    avoidAreas?: BoundingBox[];
}

export interface PathResult {
    found: boolean;
    path: GraphNode[];
    distance: number;      // km
    duration: number;       // minutes
    roadTypes: Set<string>;
    factors: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isInsideBbox(node: GraphNode, bbox: BoundingBox): boolean {
    return (
        node.lat >= bbox.minLat &&
        node.lat <= bbox.maxLat &&
        node.lng >= bbox.minLng &&
        node.lng <= bbox.maxLng
    );
}

function isNodeBlocked(
    nodeId: string,
    constraints: PathfinderConstraints
): boolean {
    if (constraints.avoidNodes?.has(nodeId)) return true;

    if (constraints.avoidAreas && constraints.avoidAreas.length > 0) {
        const node = NODES.get(nodeId);
        if (node) {
            for (const bbox of constraints.avoidAreas) {
                if (isInsideBbox(node, bbox)) return true;
            }
        }
    }

    return false;
}

// ─── A* Search ───────────────────────────────────────────────────────────────

export function findRoute(
    originId: string,
    destinationId: string,
    constraints: PathfinderConstraints = {}
): PathResult {
    const origin = NODES.get(originId);
    const destination = NODES.get(destinationId);

    if (!origin || !destination) {
        return {
            found: false,
            path: [],
            distance: 0,
            duration: 0,
            roadTypes: new Set(),
            factors: ["Origin or destination node not found in graph"],
        };
    }

    // Heuristic: straight-line distance to destination
    function h(nodeId: string): number {
        const n = NODES.get(nodeId)!;
        return haversineDistance(n.lat, n.lng, destination!.lat, destination!.lng);
    }

    // Priority queue (simple sorted array – graph is small)
    const openSet: string[] = [originId];
    const cameFrom = new Map<string, string>();
    const edgeUsed = new Map<string, GraphEdge>();

    const gScore = new Map<string, number>();
    gScore.set(originId, 0);

    const fScore = new Map<string, number>();
    fScore.set(originId, h(originId));

    const closedSet = new Set<string>();
    let avoidedNodeCount = 0;
    let avoidedAreaCount = 0;

    while (openSet.length > 0) {
        // Pick node with lowest fScore
        openSet.sort((a, b) => (fScore.get(a) ?? Infinity) - (fScore.get(b) ?? Infinity));
        const current = openSet.shift()!;

        if (current === destinationId) {
            // ✅ Reconstruct path
            const path: GraphNode[] = [];
            const roadTypes = new Set<string>();
            let totalDistance = 0;
            let totalDuration = 0;
            let node = current;

            while (node !== originId) {
                path.unshift(NODES.get(node)!);
                const edge = edgeUsed.get(node);
                if (edge) {
                    totalDistance += edge.distance;
                    totalDuration += edge.duration;
                    roadTypes.add(edge.roadType);
                }
                node = cameFrom.get(node)!;
            }
            path.unshift(origin);

            totalDistance = Math.round(totalDistance * 100) / 100;
            totalDuration = Math.round(totalDuration * 100) / 100;

            const factors: string[] = [];
            if (avoidedNodeCount > 0) {
                factors.push(`Route avoids ${avoidedNodeCount} blocked checkpoint(s)`);
            }
            if (avoidedAreaCount > 0) {
                factors.push(`Route avoids ${avoidedAreaCount} restricted area(s)`);
            }
            if (roadTypes.has("primary")) {
                factors.push("Primary roads used where possible");
            }
            if (roadTypes.has("tertiary")) {
                factors.push("Some tertiary roads used – may be slower");
            }
            if (factors.length === 0) {
                factors.push("Direct route found with no constraints applied");
            }

            return {
                found: true,
                path,
                distance: totalDistance,
                duration: totalDuration,
                roadTypes,
                factors,
            };
        }

        closedSet.add(current);

        const neighbors = ADJACENCY.get(current) ?? [];
        for (const edge of neighbors) {
            if (closedSet.has(edge.to)) continue;

            // Check constraints
            if (edge.to !== destinationId && isNodeBlocked(edge.to, constraints)) {
                if (constraints.avoidNodes?.has(edge.to)) avoidedNodeCount++;
                else avoidedAreaCount++;
                continue;
            }

            const tentativeG = (gScore.get(current) ?? Infinity) + edge.distance;

            if (tentativeG < (gScore.get(edge.to) ?? Infinity)) {
                cameFrom.set(edge.to, current);
                edgeUsed.set(edge.to, edge);
                gScore.set(edge.to, tentativeG);
                fScore.set(edge.to, tentativeG + h(edge.to));

                if (!openSet.includes(edge.to)) {
                    openSet.push(edge.to);
                }
            }
        }
    }

    // No path found
    const factors: string[] = ["No route found between the two locations"];
    if ((constraints.avoidNodes?.size ?? 0) > 0 || (constraints.avoidAreas?.length ?? 0) > 0) {
        factors.push("Constraints may have blocked all available paths – try relaxing them");
    }

    return {
        found: false,
        path: [],
        distance: 0,
        duration: 0,
        roadTypes: new Set(),
        factors,
    };
}
