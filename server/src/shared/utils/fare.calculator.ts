export const BASE_FARE_POYSHA = 5_000;
export const DISTANCE_RATE_POYSHA_PER_KM = 2_000;
export const POOLED_FARE_NUMERATOR = 3;
export const POOLED_FARE_DENOMINATOR = 4;

export interface FareBreakdown {
  baseFarePoysha: number;
  distanceChargePoysha: number;
  poolDiscountPoysha: number;
  totalPoysha: number;
}

export function calculateDistanceChargePoysha(distanceKm: number): number {
  const distanceMeters = Math.round(distanceKm * 1000);
  return distanceMeters * (DISTANCE_RATE_POYSHA_PER_KM / 1000);
}

export function calculateSoloFarePoysha(distanceKm: number): number {
  return BASE_FARE_POYSHA + calculateDistanceChargePoysha(distanceKm);
}

export function calculatePooledFarePoysha(distanceKm: number): number {
  const soloFare = calculateSoloFarePoysha(distanceKm);
  return Math.round((soloFare * POOLED_FARE_NUMERATOR) / POOLED_FARE_DENOMINATOR);
}

export function calculateFare(distanceKm: number, isPooled: boolean): number {
  return isPooled ? calculatePooledFarePoysha(distanceKm) : calculateSoloFarePoysha(distanceKm);
}

export function getFareBreakdown(distanceKm: number, isPooled: boolean): FareBreakdown {
  const baseFarePoysha = BASE_FARE_POYSHA;
  const distanceChargePoysha = calculateDistanceChargePoysha(distanceKm);
  const soloFare = baseFarePoysha + distanceChargePoysha;
  const totalPoysha = isPooled
    ? Math.round((soloFare * POOLED_FARE_NUMERATOR) / POOLED_FARE_DENOMINATOR)
    : soloFare;

  return {
    baseFarePoysha,
    distanceChargePoysha,
    poolDiscountPoysha: soloFare - totalPoysha,
    totalPoysha,
  };
}