import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import styles from './MapView.module.css'

// Custom colored pin markers per event source (avoids Leaflet's broken
// default icon paths in bundlers, and color-codes by provider)
function makePin(color) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:22px;height:22px;border-radius:50% 50% 50% 0;
      background:${color};transform:rotate(-45deg);
      border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    popupAnchor: [0, -20],
  })
}

const PINS = {
  ticketmaster: makePin('#026CDF'),
  eventbrite: makePin('#F05537'),
}

function FitBounds({ points }) {
  const map = useMap()
  useMemo(() => {
    if (points.length === 0) return
    if (points.length === 1) {
      map.setView(points[0], 13)
    } else {
      map.fitBounds(points, { padding: [40, 40] })
    }
  }, [points, map])
  return null
}

function formatDate(date, time) {
  if (!date) return 'Date TBA'
  const d = new Date(`${date}T${time || '00:00'}`)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
    (time ? ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '')
}

export default function MapView({ events }) {
  // Only events with real coordinates can be plotted
  const mapped = useMemo(
    () => events.filter(e => typeof e.lat === 'number' && typeof e.lng === 'number'),
    [events]
  )
  const points = useMemo(() => mapped.map(e => [e.lat, e.lng]), [mapped])
  const withoutCoords = events.length - mapped.length

  if (mapped.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>🗺️</span>
        <p>None of these events have map locations available.</p>
        <p className={styles.emptySub}>Try the Grid or Calendar view instead.</p>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <MapContainer
        center={points[0]}
        zoom={12}
        scrollWheelZoom
        className={styles.map}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {mapped.map(e => (
          <Marker key={e.id} position={[e.lat, e.lng]} icon={PINS[e.source] || PINS.ticketmaster}>
            <Popup>
              <div className={styles.popup}>
                <strong className={styles.popupName}>{e.name}</strong>
                <span className={styles.popupDate}>{formatDate(e.start_date, e.start_time)}</span>
                {e.venue_name && <span className={styles.popupVenue}>📍 {e.venue_name}</span>}
                <a href={e.url} target="_blank" rel="noopener noreferrer" className={styles.popupLink}>
                  View event →
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {withoutCoords > 0 && (
        <p className={styles.note}>
          {withoutCoords} event{withoutCoords !== 1 ? 's' : ''} without a map location {withoutCoords !== 1 ? 'are' : 'is'} hidden here — see them in Grid or Calendar view.
        </p>
      )}
    </div>
  )
}
