function floorToPrecision(value: number, precision: number): number {
  const factor = 10 ** precision;
  return Math.floor(value * factor) / factor;
}

export function computeGridKey(lat: number, lng: number, precision: number = 2): string {
  const flooredLat = floorToPrecision(lat, precision);
  const flooredLng = floorToPrecision(lng, precision);
  return `${flooredLat.toFixed(precision)}:${flooredLng.toFixed(precision)}`;
}

export function detectDuplicateLogic(): void {
  // TODO: implement duplicate detection domain logic.
}
