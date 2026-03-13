/**
 * Palestine Road Network Graph
 *
 * Simplified graph of major cities/towns in Palestine with road connections.
 * Distances are computed via Haversine formula, durations via assumed speeds.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GraphNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
  governorate: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  distance: number; // km
  duration: number; // minutes
  roadType: "primary" | "secondary" | "tertiary";
}

// ─── Haversine ───────────────────────────────────────────────────────────────

const R_KM = 6371; // Earth's radius in km

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Average speeds (km/h) used to estimate duration
const SPEED: Record<GraphEdge["roadType"], number> = {
  primary: 60,
  secondary: 45,
  tertiary: 30,
};

function makeEdge(
  from: string,
  to: string,
  roadType: GraphEdge["roadType"],
  nodes: Map<string, GraphNode>
): GraphEdge[] {
  const a = nodes.get(from)!;
  const b = nodes.get(to)!;
  const distance = Math.round(haversineDistance(a.lat, a.lng, b.lat, b.lng) * 100) / 100;
  const duration = Math.round((distance / SPEED[roadType]) * 60 * 100) / 100;
  // Bidirectional edges
  return [
    { from, to, distance, duration, roadType },
    { from: to, to: from, distance, duration, roadType },
  ];
}

// ─── Nodes (Cities & Towns) ──────────────────────────────────────────────────

const NODES_ARRAY: GraphNode[] = [
  // West Bank
  { id: "ramallah",    name: "Ramallah",    lat: 31.9038, lng: 35.2034, governorate: "Ramallah & Al-Bireh" },
  { id: "albireh",     name: "Al-Bireh",    lat: 31.9130, lng: 35.2170, governorate: "Ramallah & Al-Bireh" },
  { id: "birzeit",     name: "Birzeit",     lat: 31.9650, lng: 35.1950, governorate: "Ramallah & Al-Bireh" },
  { id: "nablus",      name: "Nablus",      lat: 32.2211, lng: 35.2544, governorate: "Nablus" },
  { id: "jenin",       name: "Jenin",       lat: 32.4610, lng: 35.2998, governorate: "Jenin" },
  { id: "tulkarm",     name: "Tulkarm",     lat: 32.3104, lng: 35.0286, governorate: "Tulkarm" },
  { id: "qalqilya",    name: "Qalqilya",    lat: 32.1892, lng: 34.9706, governorate: "Qalqilya" },
  { id: "salfit",      name: "Salfit",      lat: 32.0830, lng: 35.1730, governorate: "Salfit" },
  { id: "jericho",     name: "Jericho",     lat: 31.8611, lng: 35.4606, governorate: "Jericho" },
  { id: "bethlehem",   name: "Bethlehem",   lat: 31.7054, lng: 35.2024, governorate: "Bethlehem" },
  { id: "hebron",      name: "Hebron",      lat: 31.5326, lng: 35.0998, governorate: "Hebron" },
  { id: "tubas",       name: "Tubas",       lat: 32.3212, lng: 35.3687, governorate: "Tubas" },
  { id: "dura",        name: "Dura",        lat: 31.5011, lng: 35.0261, governorate: "Hebron" },
  { id: "beitjala",    name: "Beit Jala",   lat: 31.7145, lng: 35.1850, governorate: "Bethlehem" },
  { id: "azzun",       name: "Azzun",       lat: 32.1960, lng: 35.0310, governorate: "Qalqilya" },
  { id: "yatta",       name: "Yatta",       lat: 31.4545, lng: 35.0833, governorate: "Hebron" },
  { id: "halhul",      name: "Halhul",      lat: 31.5835, lng: 35.1002, governorate: "Hebron" },
  { id: "silwad",      name: "Silwad",      lat: 31.9570, lng: 35.2700, governorate: "Ramallah & Al-Bireh" },

  // Gaza Strip
  { id: "gaza",        name: "Gaza City",   lat: 31.5017, lng: 34.4668, governorate: "Gaza" },
  { id: "khanyunis",   name: "Khan Yunis",  lat: 31.3462, lng: 34.3060, governorate: "Khan Yunis" },
  { id: "rafah",       name: "Rafah",       lat: 31.2969, lng: 34.2455, governorate: "Rafah" },
  { id: "deiralbalah", name: "Deir al-Balah", lat: 31.4177, lng: 34.3509, governorate: "Deir al-Balah" },
  { id: "jabalia",     name: "Jabalia",     lat: 31.5283, lng: 34.4832, governorate: "North Gaza" },
  { id: "beithanoun",  name: "Beit Hanoun", lat: 31.5393, lng: 34.5366, governorate: "North Gaza" },
  { id: "beitlahia",   name: "Beit Lahia",  lat: 31.5504, lng: 34.4577, governorate: "North Gaza" },
];

export const NODES: Map<string, GraphNode> = new Map(NODES_ARRAY.map((n) => [n.id, n]));

// ─── Edges (Road Connections) ────────────────────────────────────────────────

function buildEdges(): GraphEdge[] {
  const connections: Array<[string, string, GraphEdge["roadType"]]> = [
    // -- West Bank primary roads --
    ["ramallah", "albireh", "primary"],
    ["ramallah", "birzeit", "secondary"],
    ["ramallah", "bethlehem", "primary"],
    ["ramallah", "jericho", "primary"],
    ["ramallah", "salfit", "secondary"],
    ["ramallah", "silwad", "secondary"],
    ["birzeit", "nablus", "secondary"],
    ["silwad", "nablus", "secondary"],
    ["nablus", "tulkarm", "primary"],
    ["nablus", "jenin", "primary"],
    ["nablus", "tubas", "secondary"],
    ["nablus", "salfit", "secondary"],
    ["jenin", "tulkarm", "secondary"],
    ["jenin", "tubas", "secondary"],
    ["tulkarm", "qalqilya", "primary"],
    ["qalqilya", "azzun", "secondary"],
    ["azzun", "salfit", "tertiary"],
    ["bethlehem", "beitjala", "secondary"],
    ["bethlehem", "hebron", "primary"],
    ["bethlehem", "jericho", "secondary"],
    ["hebron", "halhul", "primary"],
    ["hebron", "dura", "secondary"],
    ["hebron", "yatta", "secondary"],
    ["halhul", "bethlehem", "secondary"],

    // -- Gaza Strip roads --
    ["gaza", "jabalia", "primary"],
    ["gaza", "deiralbalah", "primary"],
    ["jabalia", "beithanoun", "secondary"],
    ["jabalia", "beitlahia", "secondary"],
    ["beithanoun", "beitlahia", "tertiary"],
    ["deiralbalah", "khanyunis", "primary"],
    ["khanyunis", "rafah", "primary"],
  ];

  const edges: GraphEdge[] = [];
  for (const [from, to, roadType] of connections) {
    edges.push(...makeEdge(from, to, roadType, NODES));
  }
  return edges;
}

export const EDGES: GraphEdge[] = buildEdges();

// Adjacency list for quick lookups
export const ADJACENCY: Map<string, GraphEdge[]> = new Map();
for (const edge of EDGES) {
  if (!ADJACENCY.has(edge.from)) ADJACENCY.set(edge.from, []);
  ADJACENCY.get(edge.from)!.push(edge);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Find the nearest node to a lat/lng coordinate */
export function findNearestNode(lat: number, lng: number): GraphNode {
  let best: GraphNode = NODES_ARRAY[0];
  let bestDist = Infinity;
  for (const node of NODES_ARRAY) {
    const d = haversineDistance(lat, lng, node.lat, node.lng);
    if (d < bestDist) {
      bestDist = d;
      best = node;
    }
  }
  return best;
}

/** Find a node by name (case-insensitive) */
export function findNodeByName(name: string): GraphNode | null {
  const lower = name.trim().toLowerCase();
  for (const node of NODES_ARRAY) {
    if (node.name.toLowerCase() === lower || node.id === lower) {
      return node;
    }
  }
  return null;
}

/** Get all nodes as an array (for the /network endpoint) */
export function getAllNodes(): GraphNode[] {
  return [...NODES_ARRAY];
}
