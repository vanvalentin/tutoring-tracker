import { Autocomplete, TextField } from '@mui/material'
import { useMemo } from 'react'

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  isClearable = true,
  getOptionLabel,
  getOptionValue,
  isOptionEqualToValue,
  size = 'medium',
  ...rest
}) {
  const getLabel = (opt) =>
    typeof opt === 'string' ? opt : getOptionLabel?.(opt) ?? opt.label ?? opt.name ?? String(opt)
  const getValue = (opt) =>
    typeof opt === 'string' ? opt : getOptionValue?.(opt) ?? opt.value ?? opt.id ?? opt

  const selectOptions = useMemo(
    () =>
      options.map((opt) =>
        typeof opt === 'string' ? opt : opt
      ),
    [options]
  )

  const selectedOption = useMemo(() => {
    if (value == null || value === '') return null
    const found = selectOptions.find((o) => getValue(o) === value)
    return found ?? null
  }, [value, selectOptions, getValue])

  const handleChange = (_, newValue) => {
    onChange(newValue ? getValue(newValue) : '')
  }

  return (
    <Autocomplete
      options={selectOptions}
      value={selectedOption}
      onChange={handleChange}
      getOptionLabel={getLabel}
      isOptionEqualToValue={
        isOptionEqualToValue ??
        ((opt, val) => getValue(opt) === (val ? getValue(val) : val))
      }
      clearOnBlur={false}
      disableClearable={!isClearable}
      fullWidth
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={placeholder}
          variant="outlined"
          size={size}
        />
      )}
      {...rest}
    />
  )
}
