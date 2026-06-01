/**
 * Calendar export helpers.
 * Generates standards-compliant .ics files that import into Apple Calendar,
 * Google Calendar, Outlook, etc.
 */

function pad(n) {
  return String(n).padStart(2, '0')
}

/** Format a Date as ICS "floating local time" (no timezone, no Z). */
function toIcsLocal(date) {
  return (
    date.getFullYear() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    'T' +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  )
}

/** Format as ICS UTC (YYYYMMDDTHHMMSSZ). */
function toIcsUtc(date) {
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  )
}

/** Escape an ICS text field. */
function ics(s = '') {
  return String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}

/** Parse an event into a {start, end} Date pair. End defaults to start + 2h. */
function eventToDates(event) {
  if (!event.start_date) return null
  const startLocal = new Date(`${event.start_date}T${event.start_time || '19:00'}:00`)
  const endLocal = new Date(startLocal.getTime() + 2 * 60 * 60 * 1000) // +2h
  return { start: startLocal, end: endLocal }
}

/** Build an ICS string for a single event. */
export function buildIcs(event) {
  const dates = eventToDates(event)
  if (!dates) return null

  const location = [event.venue_name, event.venue_address, event.city, event.state]
    .filter(Boolean)
    .join(', ')

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Vagari Vita//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@urban-nomad.app`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    `DTSTART:${toIcsLocal(dates.start)}`,
    `DTEND:${toIcsLocal(dates.end)}`,
    `SUMMARY:${ics(event.name)}`,
    location && `LOCATION:${ics(location)}`,
    event.url && `URL:${ics(event.url)}`,
    event.url && `DESCRIPTION:${ics(`From Vagari Vita. Tickets: ${event.url}`)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean)

  return lines.join('\r\n')
}

/** Trigger a browser download for an event's .ics file. */
export function downloadIcs(event) {
  const text = buildIcs(event)
  if (!text) return
  const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(event.name || 'event').replace(/[^a-z0-9-_]+/gi, '_').slice(0, 60)}.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Build a Google Calendar "TEMPLATE" link that pre-fills the event form. */
export function googleCalUrl(event) {
  const dates = eventToDates(event)
  if (!dates) return null
  const location = [event.venue_name, event.venue_address, event.city, event.state]
    .filter(Boolean)
    .join(', ')
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.name || 'Event',
    dates: `${toIcsUtc(dates.start)}/${toIcsUtc(dates.end)}`,
    location,
    details: event.url ? `Tickets: ${event.url}` : '',
  })
  return `https://calendar.google.com/calendar/render?${params}`
}
