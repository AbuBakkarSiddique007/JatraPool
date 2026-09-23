import { DHAKA_ZONES } from "../../shared/constants/zones.constant.js";
import { Corridor, ZoneRoute } from "./pools.interface.js";

export const BANANI_CORRIDOR: Corridor = {
  name: "Banani -> Mohakhali/Gulshan 1",
  routeKey: "BANANI-CORRIDOR",
  originZone: "BANANI",
  destinationZones: ["MOHAKHALI", "GULSHAN_1"],
};

export const CORRIDORS: readonly Corridor[] = [BANANI_CORRIDOR];

function isValidZone(zone: string): zone is keyof typeof DHAKA_ZONES {
  return zone in DHAKA_ZONES;
}

export function getCorridorForRoute(route: ZoneRoute): Corridor | null {
  if (!isValidZone(route.pickupZone) || !isValidZone(route.dropoffZone)) {
    return null;
  }

  for (const corridor of CORRIDORS) {
    if (
      corridor.originZone === route.pickupZone &&
      corridor.destinationZones.includes(route.dropoffZone)
    ) {
      return corridor;
    }
  }

  return null;
}

export function canSharePool(routeA: ZoneRoute, routeB: ZoneRoute): boolean {
  const corridorA = getCorridorForRoute(routeA);
  const corridorB = getCorridorForRoute(routeB);

  return corridorA !== null && corridorB !== null && corridorA.routeKey === corridorB.routeKey;
}