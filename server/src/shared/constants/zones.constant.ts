export interface DhakaZone {
  name: string;
  lat: number;
  lng: number;
  distanceFromBananiKm: number;
}

export const DHAKA_ZONES: Record<string, DhakaZone> = {
  BANANI: {
    name: "Banani Road 11",
    lat: 23.7937,
    lng: 90.4043,
    distanceFromBananiKm: 0.0,
  },

  GULSHAN_1: {
    name: "Gulshan 1 Circle",
    lat: 23.7785,
    lng: 90.4172,
    distanceFromBananiKm: 3.0,
  },

  MOHAKHALI: {
    name: "Mohakhali Wireless",
    lat: 23.7776,
    lng: 90.4005,
    distanceFromBananiKm: 4.0,
  },

  DHANMONDI: {
    name: "Dhanmondi 27",
    lat: 23.754,
    lng: 90.3768,
    distanceFromBananiKm: 8.0,
  },
  
  UTTARA: {
    name: "Uttara Sector 3",
    lat: 23.8681,
    lng: 90.3984,
    distanceFromBananiKm: 9.0,
  },
};
