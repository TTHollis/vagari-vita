import { buildAccommodationLinks, groupByType } from '../utils/accommodations'
import styles from './Accommodations.module.css'

const COPY = {
  local: {
    heading: '🛏️ Hosting Visitors?',
    sub: (city) =>
      `Friends or family heading to ${city}? Find them a great place to stay — or book a local staycation of your own.`,
  },
  wander: {
    heading: '🛏️ Where to Stay',
    sub: (city) =>
      `Compare places to stay in ${city} for your trip — hotels, hostels, and home rentals, all in one spot.`,
  },
}

function prettyDate(iso) {
  if (!iso) return ''
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Accommodations({ city, dateRange = {}, mode = 'wander', accentColor = 'green' }) {
  const copy = COPY[mode] || COPY.wander
  const { start_date, end_date } = dateRange
  const hasDates = Boolean(start_date && end_date)
  const groups = groupByType(buildAccommodationLinks(city, start_date, end_date))
  const accent = accentColor === 'amber' ? styles.amber : styles.green

  return (
    <section className={styles.wrap}>
      <div className={styles.intro}>
        <h2 className={styles.heading}>{copy.heading}</h2>
        <p className={styles.sub}>{copy.sub(city)}</p>
        <div className={`${styles.dateNote} ${accent}`}>
          {hasDates
            ? <>📅 Dates applied: <strong>{prettyDate(start_date)} – {prettyDate(end_date)}</strong> <span className={styles.dateNoteDim}>(where the provider supports it)</span></>
            : <>📅 Tip: set a date range on the Events tab and it'll carry into hotel & rental searches automatically.</>
          }
        </div>
      </div>

      {groups.map(group => (
        <div key={group.type} className={styles.group}>
          <h3 className={styles.groupTitle}><span>{group.icon}</span> {group.type}</h3>
          <div className={styles.grid}>
            {group.items.map(item => (
              <a
                key={item.name}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.card} ${accent}`}
              >
                <span className={styles.cardName}>{item.name}</span>
                <span className={styles.cardBlurb}>{item.blurb}</span>
                <span className={styles.cardArrow}>Search →</span>
              </a>
            ))}
          </div>
        </div>
      ))}

      <p className={styles.disclaimer}>
        Links open each provider's own search in a new tab. Vagari Vita doesn't process bookings or payments.
      </p>
    </section>
  )
}
