export const washoeCounty = {
  id: "c-washoe",
  name: "Washoe County",
  state: "NV",
  centerLatLng: { lat: 39.55, lng: -119.8 },
} as const;

export const towns = [
  { id: "t-reno", name: "Reno", lat: 39.5296, lng: -119.8138 },
  { id: "t-sparks", name: "Sparks", lat: 39.5349, lng: -119.7527 },
  { id: "t-sun-valley", name: "Sun Valley", lat: 39.5966, lng: -119.7763 },
  { id: "t-spanish-springs", name: "Spanish Springs", lat: 39.6455, lng: -119.7076 },
  { id: "t-incline", name: "Incline Village", lat: 39.2513, lng: -119.9729 },
  { id: "t-verdi", name: "Verdi", lat: 39.5180, lng: -119.9880 },
  { id: "t-cold-springs", name: "Cold Springs", lat: 39.6757, lng: -119.9993 },
  { id: "t-golden-valley", name: "Golden Valley", lat: 39.6484, lng: -119.9169 },
  { id: "t-north-valleys", name: "North Valleys", lat: 39.6403, lng: -119.8227 }
] as const;

export type Town = (typeof towns)[number];
