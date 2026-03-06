import DirectionsSubwayIcon from '@mui/icons-material/DirectionsSubway'
import LocalTaxiIcon from '@mui/icons-material/LocalTaxi'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import EditIcon from '@mui/icons-material/Edit'
import { CircularProgress, Tooltip } from '@mui/material'
import { Link } from 'react-router-dom'
import { useTransitTime } from '../hooks/useTransitTime'
import { estimateTaxiFare } from '../utils/taxiFare'

/**
 * Slim panel displayed between two consecutive lessons on the same day.
 *
 * Props:
 *   fromStudent  — student object ({ id, address, name }) — end of previous lesson
 *   toStudent    — student object ({ id, address, name }) — start of next lesson
 *   gapMinutes   — minutes between end of prev lesson and start of next (null if unknown)
 */
export default function TransitInfo({ fromStudent, toStudent, gapMinutes }) {
  const { data, loading, error } = useTransitTime(
    fromStudent?.id,
    toStudent?.id,
    fromStudent?.address,
    toStudent?.address
  )

  const fromHasAddress = !!fromStudent?.address?.trim()
  const toHasAddress = !!toStudent?.address?.trim()
  const hasAddresses = fromHasAddress && toHasAddress

  // Gap status: compare buffer (gapMinutes) against transit time
  function bufferStatus(transitMin) {
    if (gapMinutes == null || transitMin == null) return 'neutral'
    if (gapMinutes < transitMin) return 'tight'
    if (gapMinutes < transitMin + 10) return 'warning'
    return 'ok'
  }

  const status = data ? bufferStatus(data.transitMinutes) : 'neutral'

  const statusColors = {
    tight: { border: 'border-red-200', bg: 'bg-red-50', gap: 'text-red-600' },
    warning: { border: 'border-amber-200', bg: 'bg-amber-50', gap: 'text-amber-600' },
    ok: { border: 'border-green-200', bg: 'bg-green-50', gap: 'text-green-700' },
    neutral: { border: 'border-gray-200', bg: 'bg-gray-50', gap: 'text-gray-500' },
  }
  const colors = statusColors[status]

  // Build the list of students missing an address
  const missing = [
    !fromHasAddress && fromStudent?.name,
    !toHasAddress && toStudent?.name,
  ].filter(Boolean)

  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-1 border-y px-4 py-1.5 text-xs ${colors.border} ${colors.bg}`}
    >
      {/* Gap indicator */}
      {gapMinutes != null && (
        <span className={`flex items-center gap-1 font-medium ${colors.gap}`}>
          <AccessTimeIcon sx={{ fontSize: 13 }} />
          {gapMinutes} min gap
        </span>
      )}

      {!hasAddresses ? (
        <Link
          to="/students"
          className="flex items-center gap-1 italic text-gray-400 hover:text-blue-600 hover:no-underline transition-colors"
        >
          <EditIcon sx={{ fontSize: 12 }} />
          Add address for {missing.join(' & ')} to see transit estimate
        </Link>
      ) : loading ? (
        <span className="flex items-center gap-1.5 text-gray-400">
          <CircularProgress size={10} thickness={5} />
          Calculating...
        </span>
      ) : error ? (
        <Tooltip title={error} placement="top">
          <span className="cursor-help text-gray-400 italic">Transit unavailable</span>
        </Tooltip>
      ) : data ? (
        <>
          <span className="flex items-center gap-1 text-gray-600">
            <DirectionsSubwayIcon sx={{ fontSize: 13 }} />
            ~{data.transitMinutes} min
          </span>
          <span className="flex items-center gap-1 text-gray-600">
            <LocalTaxiIcon sx={{ fontSize: 13 }} />
            ~{data.drivingMinutes} min · ~HK${estimateTaxiFare(data.distanceMeters)}
          </span>
        </>
      ) : null}
    </div>
  )
}
