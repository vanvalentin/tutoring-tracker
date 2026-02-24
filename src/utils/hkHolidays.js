import Holidays from 'date-holidays'

const hd = new Holidays('HK', { timezone: 'Asia/Hong_Kong' })

/**
 * Get Hong Kong public holidays for a given year.
 * @param {number} year - e.g. 2026
 * @returns {Array<{ date: string, name: string }>} Holidays with date (YYYY-MM-DD) and name
 */
export function getHolidaysForYear(year) {
  const holidays = hd.getHolidays(year)
  return holidays.map((h) => ({
    date: h.date.split(' ')[0],
    name: h.name,
  }))
}

/**
 * Check if a date is a Hong Kong public holiday.
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {false | { date: string, name: string }} false if not a holiday, or { date, name } if it is
 */
export function isHoliday(dateStr) {
  if (!dateStr) return false
  const date = new Date(dateStr + 'T12:00:00+08:00')
  const result = hd.isHoliday(date)
  if (!result || result.length === 0) return false
  const first = result[0]
  return {
    date: first.date.split(' ')[0],
    name: first.name,
  }
}
