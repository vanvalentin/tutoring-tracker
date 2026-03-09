// Vercel serverless function: fetches transit and driving times from Google Maps.
// Keeps the API key server-side and caches nothing here (caching is done in Supabase).

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' })
  }

  const { fromAddress, toAddress } = body || {}

  if (!fromAddress || !toAddress) {
    return res.status(400).json({ error: 'fromAddress and toAddress are required' })
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Google Maps API key not configured' })
  }

  // Append ", Hong Kong" for geocoding accuracy if not already present
  const suffix = ', Hong Kong'
  const origin = fromAddress.toLowerCase().includes('hong kong') ? fromAddress : fromAddress + suffix
  const destination = toAddress.toLowerCase().includes('hong kong') ? toAddress : toAddress + suffix

  const base = 'https://maps.googleapis.com/maps/api/distancematrix/json'
  const sharedParams = new URLSearchParams({
    origins: origin,
    destinations: destination,
    key: apiKey,
    region: 'hk',
    language: 'en',
  })

  // departure_time required for transit mode; use current time rounded to nearest hour
  const departureTime = Math.floor(Date.now() / 1000)

  try {
    const [transitRes, drivingRes] = await Promise.all([
      fetch(`${base}?${sharedParams}&mode=transit&departure_time=${departureTime}`),
      fetch(`${base}?${sharedParams}&mode=driving`),
    ])

    const [transitData, drivingData] = await Promise.all([
      transitRes.json(),
      drivingRes.json(),
    ])

    if (transitData.status && transitData.status !== 'OK') {
      return res.status(502).json({
        error: 'Transit API request failed',
        detail: transitData.status,
        providerMessage: transitData.error_message ?? null,
      })
    }

    if (drivingData.status && drivingData.status !== 'OK') {
      return res.status(502).json({
        error: 'Driving API request failed',
        detail: drivingData.status,
        providerMessage: drivingData.error_message ?? null,
      })
    }

    const transitElement = transitData.rows?.[0]?.elements?.[0]
    const drivingElement = drivingData.rows?.[0]?.elements?.[0]

    if (transitElement?.status !== 'OK') {
      return res.status(422).json({
        error: 'Could not compute transit route',
        detail: transitElement?.status,
      })
    }

    if (drivingElement?.status !== 'OK') {
      return res.status(422).json({
        error: 'Could not compute driving route',
        detail: drivingElement?.status,
      })
    }

    return res.status(200).json({
      transitMinutes: Math.round(transitElement.duration.value / 60),
      drivingMinutes: Math.round(drivingElement.duration.value / 60),
      distanceMeters: drivingElement.distance.value,
    })
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error', detail: err.message })
  }
}
