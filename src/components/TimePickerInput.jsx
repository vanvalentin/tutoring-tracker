import dayjs from 'dayjs'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker'

/**
 * Convert "HH:mm" to dayjs (uses arbitrary date, time only matters)
 */
function toDayjs(value) {
  if (!value) return null
  const [h, m] = value.split(':')
  const hour = parseInt(h, 10)
  const minute = parseInt(m || '0', 10)
  if (isNaN(hour) || isNaN(minute)) return null
  return dayjs().hour(hour).minute(minute).second(0).millisecond(0)
}

/**
 * Convert dayjs to "HH:mm"
 */
function toHHmm(d) {
  if (!d || !d.isValid?.()) return ''
  return d.format('HH:mm')
}

const actionBarProps = {
  actions: ['clear', 'cancel', 'accept'],
}

export default function TimePickerInput({ value, onChange, variant = 'responsive', placeholder = 'Select time', className = '', slotProps: slotPropsProp, ...props }) {
  const dayjsValue = toDayjs(value)

  const handleChange = (newValue) => {
    onChange?.(toHHmm(newValue))
  }

  const slotProps = { actionBar: actionBarProps, ...slotPropsProp }

  if (variant === 'mobile') {
    return (
      <MobileTimePicker
        value={dayjsValue}
        onChange={handleChange}
        ampm
        label={placeholder}
        slotProps={slotProps}
        className={className}
        {...props}
      />
    )
  }

  return (
    <TimePicker
      value={dayjsValue}
      onChange={handleChange}
      ampm
      label={placeholder}
      slotProps={slotProps}
      className={className}
      {...props}
    />
  )
}
