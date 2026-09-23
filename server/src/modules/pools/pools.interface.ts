export interface ZoneRoute {
  pickupZone: string;
  dropoffZone: string;
}

export interface Corridor {
  name: string;
  routeKey: string;
  originZone: string;
  destinationZones: readonly string[];
}

export interface AllocateSeatInput {
  poolId: string;
  rideRequestId: string;
  requestedSeats: number;
  individualFarePoysha: number;
}