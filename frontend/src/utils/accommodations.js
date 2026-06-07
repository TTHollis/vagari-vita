/**
 * Builds deep-link search URLs for accommodation providers, pre-filled with the
 * city and (where supported) check-in/check-out dates. No API keys needed —
 * these open the provider's own search results in a new tab.
 *
 * Affiliate note: most of these support affiliate/partner IDs (e.g. Booking.com
 * aid=, Airbnb is via their partner program). Those can be appended later to
 * earn referral revenue without changing this structure.
 */

export function buildAccommodationLinks(city, checkIn, checkOut) {
  const q = encodeURIComponent(city || '')
  const hasDates = Boolean(checkIn && checkOut)

  // Provider-specific date fragments
  const bookingDates = hasDates ? `&checkin=${checkIn}&checkout=${checkOut}` : ''
  const airbnbDates = hasDates ? `&checkin=${checkIn}&checkout=${checkOut}` : ''
  const vrboDates = hasDates ? `&startDate=${checkIn}&endDate=${checkOut}` : ''

  return [
    // 🏨 Hotels
    {
      type: 'Hotels',
      name: 'Booking.com',
      blurb: 'Hotels, apartments & more',
      url: `https://www.booking.com/searchresults.html?ss=${q}&group_adults=2${bookingDates}`,
    },
    {
      type: 'Hotels',
      name: 'Google Hotels',
      blurb: 'Compare across sites',
      url: `https://www.google.com/travel/search?q=${encodeURIComponent((city || '') + ' hotels')}`,
    },
    // 🏠 Homes & rentals
    {
      type: 'Homes & Rentals',
      name: 'Airbnb',
      blurb: 'Homes, rooms & unique stays',
      url: `https://www.airbnb.com/s/${q}/homes?query=${q}${airbnbDates}`,
    },
    {
      type: 'Homes & Rentals',
      name: 'Vrbo',
      blurb: 'Whole-home vacation rentals',
      url: `https://www.vrbo.com/search?q=${q}${vrboDates}`,
    },
    // 🛏️ Hostels & budget
    {
      type: 'Hostels & Budget',
      name: 'Hostelworld',
      blurb: 'Hostels & social stays',
      url: `https://www.hostelworld.com/search?search_keywords=${q}`,
    },
    {
      type: 'Hostels & Budget',
      name: 'Hostelz',
      blurb: 'Hostel comparison',
      url: `https://www.hostelz.com/search?q=${q}`,
    },
  ]
}

const TYPE_ICONS = {
  'Hotels': '🏨',
  'Homes & Rentals': '🏠',
  'Hostels & Budget': '🛏️',
}

export function groupByType(links) {
  const map = new Map()
  for (const link of links) {
    if (!map.has(link.type)) map.set(link.type, { icon: TYPE_ICONS[link.type] || '🛏️', items: [] })
    map.get(link.type).items.push(link)
  }
  return [...map.entries()].map(([type, { icon, items }]) => ({ type, icon, items }))
}
