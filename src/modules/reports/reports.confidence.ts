export function calculateConfidenceFromVotes(upvotes: number, downvotes: number): number {
  const base = 50;
  const delta = (upvotes - downvotes) * 5;
  const rawScore = base + delta;
  return Math.min(100, Math.max(0, rawScore));
}
