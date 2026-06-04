import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import EventCard from '../components/EventCard'
import Footer from '../components/Footer'
import { useFavorites } from '../hooks/useFavorites'
import styles from './Saved.module.css'

export default function Saved() {
  const { favorites, clear } = useFavorites()
  const navigate = useNavigate()
  const [confirmClear, setConfirmClear] = useState(false)

  // Group by city for nicer browsing when the list grows
  const grouped = useMemo(() => {
    const map = new Map()
    for (const ev of favorites) {
      const key = ev.city || 'Other'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(ev)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [favorites])

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.heading}>⭐ Saved Events</h1>
            <p className={styles.sub}>
              {favorites.length === 0
                ? "Nothing saved yet — star events from Local or Wander mode."
                : `${favorites.length} event${favorites.length !== 1 ? 's' : ''} across ${grouped.length} ${grouped.length === 1 ? 'city' : 'cities'}`
              }
            </p>
          </div>
          {favorites.length > 0 && (
            confirmClear ? (
              <div className={styles.confirmRow}>
                <span className={styles.confirmText}>Clear all?</span>
                <button className={styles.confirmYes} onClick={() => { clear(); setConfirmClear(false) }}>Yes</button>
                <button className={styles.confirmNo} onClick={() => setConfirmClear(false)}>No</button>
              </div>
            ) : (
              <button className={styles.clearBtn} onClick={() => setConfirmClear(true)}>
                Clear all
              </button>
            )
          )}
        </div>

        {favorites.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📌</span>
            <p className={styles.emptyTitle}>No saved events</p>
            <p className={styles.emptySub}>
              Tap the star on any event card to save it for later.
            </p>
            <div className={styles.emptyActions}>
              <button onClick={() => navigate('/local')} className={styles.exploreBtn}>
                📍 Explore Local
              </button>
              <button onClick={() => navigate('/nomad')} className={`${styles.exploreBtn} ${styles.amber}`}>
                ✈️ Explore Wander
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.groups}>
            {grouped.map(([city, events]) => (
              <section key={city} className={styles.group}>
                <h2 className={styles.cityHeader}>
                  <span>{city}</span>
                  <span className={styles.cityCount}>{events.length}</span>
                </h2>
                <div className={styles.grid}>
                  {events.map(ev => <EventCard key={ev.id} event={ev} />)}
                </div>
              </section>
            ))}
          </div>
        )}

        <Footer />
      </main>
    </div>
  )
}
