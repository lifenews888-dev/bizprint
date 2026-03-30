import type { GeoLocation } from '../index'

const EARTH_RADIUS_KM = 6371

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/**
 * Haversine formula — distance between two coordinates in km
 */
export function calculateDistance(from: GeoLocation, to: GeoLocation): number {
  const dLat = toRad(to.latitude - from.latitude)
  const dLng = toRad(to.longitude - from.longitude)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.latitude)) *
      Math.cos(toRad(to.latitude)) *
      Math.sin(dLng / 2) ** 2

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Format distance for display: "1.2 км" or "350 м"
 */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} м`
  return `${km.toFixed(1)} км`
}

/**
 * Estimated travel time in minutes (city driving ~30 km/h)
 */
export function estimateMinutes(km: number, speedKmh = 30): number {
  return Math.max(1, Math.round((km / speedKmh) * 60))
}
