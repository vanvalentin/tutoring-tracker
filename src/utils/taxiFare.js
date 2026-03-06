// HK Urban taxi (red) fare estimation — effective July 14, 2024.
// Source: https://www.td.gov.hk/en/transport_in_hong_kong/public_transport/taxi/taxi_fare_of_hong_kong/
//
// Flagfall: HK$29 for the first 2 km.
// Then HK$2.1 per 200 m until total fare reaches HK$102.50 (~9 km total).
// Beyond that threshold: HK$1.4 per 200 m.
//
// Does NOT include cross-harbour tunnel tolls (+HK$50), luggage, or booking surcharges.
// Always display as "~HK$X" to signal it is an estimate.

const FLAGFALL = 29
const FLAGFALL_DISTANCE_M = 2000
const RATE_1_PER_200M = 2.1
const RATE_2_PER_200M = 1.4
const TIER_1_MAX_FARE = 102.5
const UNIT_M = 200

/**
 * Estimate HK urban taxi fare from a driving distance in meters.
 * @param {number} distanceMeters
 * @returns {number} Estimated fare in HKD (rounded to nearest dollar)
 */
export function estimateTaxiFare(distanceMeters) {
  if (!distanceMeters || distanceMeters <= 0) return FLAGFALL
  if (distanceMeters <= FLAGFALL_DISTANCE_M) return FLAGFALL

  let fare = FLAGFALL
  let remaining = distanceMeters - FLAGFALL_DISTANCE_M

  while (remaining > 0 && fare < TIER_1_MAX_FARE) {
    fare += RATE_1_PER_200M
    remaining -= UNIT_M
  }

  while (remaining > 0) {
    fare += RATE_2_PER_200M
    remaining -= UNIT_M
  }

  return Math.round(fare)
}
