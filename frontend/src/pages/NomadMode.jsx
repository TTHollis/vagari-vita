import { useState, useCallback, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import Header from '../components/Header'
import TipCard from '../components/TipCard'
import EventCard from '../components/EventCard'
import LocationSearch from '../components/LocationSearch'
import DateFilter from '../components/DateFilter'
import CalendarView from '../components/CalendarView'
import MapView from '../components/MapView'
import Accommodations from '../components/Accommodations'
import Footer from '../components/Footer'
import { getBriefing, getTips, getEvents } from '../services/api'
import { useRecentSearches } from '../hooks/useRecentSearches'
import { shareContent } from '../utils/share'
import styles from './NomadMode.module.css'

const TIP_CATEGORIES = ['General', 'Food', 'Transport', 'Safety', 'Etiquette', 'Nightlife', 'Hidden Gems']

// Curated list of evocative cities for the "Surprise me" button
const SURPRISE_CITIES = [
  'Tokyo', 'Kyoto', 'Lisbon', 'Porto', 'Marrakech', 'Cape Town', 'Mexico City',
  'Oaxaca', 'Buenos Aires', 'Medellín', 'Tbilisi', 'Istanbul', 'Hanoi',
  'Chiang Mai', 'Seoul', 'Taipei', 'Prague', 'Budapest', 'Ljubljana',
  'Valletta', 'Tallinn', 'Reykjavik', 'Marseille', 'Naples', 'Sevilla',
  'Cartagena', 'Lima', 'Valparaíso', 'Tangier', 'Zanzibar City', 'Luang Prabang',
  'Kathmandu', 'Tbilisi', 'Sarajevo', 'Kotor', 'Bergen', 'Edinburgh', 'Galway',
]

export default function NomadMode() {
  const [activeTab, setActiveTab] = useState('playbook')
  const [briefing, setBriefing] = useState('')
  const [tips, setTips] = useState([])
  const [events, setEvents] = useState([])
  const [tipFilter, setTipFilter] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [lastSearch, setLastSearch] = useState(null)
  const [playbookStatus, setPlaybookStatus] = useState('idle')
  const [tipsStatus, setTipsStatus] = useState('idle')
  const [eventsStatus, setEventsStatus] = useState('idle')
  const [eventsView, setEventsView] = useState('grid')
  const [dateRange, setDateRange] = useState({ preset: 'any', start_date: undefined, end_date: undefined })
  const [shareToast, setShareToast] = useState('')
  const { record } = useRecentSearches()

  // Auto-search if ?city=X is in the URL (from a shared link)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const cityParam = params.get('city')
    if (cityParam) {
      const parts = cityParam.split(',').map(s => s.trim())
      search({
        city: parts[0],
        state: parts[1] || undefined,
        displayName: cityParam,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSharePlaybook = async () => {
    const res = await shareContent({
      title: `${displayName} — Vagari Vita`,
      text: `Local guide for ${displayName}. Get the inside scoop on culture, food, and neighborhoods.`,
      url: `${window.location.origin}/nomad?city=${encodeURIComponent(displayName)}`,
    })
    if (res.method === 'clipboard' && res.ok) {
      setShareToast('Link copied to clipboard!')
    } else if (res.method === 'native' && res.cancelled) {
      return
    } else if (!res.ok) {
      setShareToast('Could not share — try long-pressing the link')
    }
    if (res.method !== 'native') {
      setTimeout(() => setShareToast(''), 2200)
    }
  }

  const search = useCallback(async ({ city, state, zip_code, displayName: name }) => {
    const cityLabel = name || zip_code || city
    setDisplayName(cityLabel)
    setLastSearch({ city, state, zip_code })
    record({ city, state, zip_code, displayName: cityLabel })
    setPlaybookStatus('loading')
    setTipsStatus('loading')
    setEventsStatus('loading')
    setBriefing('')
    setTips([])
    setEvents([])

    // Use the human-readable name for briefing/tips lookups
    const locationLabel = name || city || zip_code

    const [playbookResult, tipsResult, eventsResult] = await Promise.allSettled([
      getBriefing(locationLabel),
      getTips(locationLabel),
      getEvents({
        city,
        state,
        zip_code,
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
        size: 24,
      }),
    ])

    if (playbookResult.status === 'fulfilled') {
      setBriefing(playbookResult.value.briefing)
      setPlaybookStatus('success')
    } else {
      setPlaybookStatus('error')
    }

    if (tipsResult.status === 'fulfilled') {
      setTips(tipsResult.value.tips || [])
      setTipsStatus('success')
    } else {
      setTipsStatus('error')
    }

    if (eventsResult.status === 'fulfilled') {
      setEvents(eventsResult.value.events || [])
      if (eventsResult.value.corrected && eventsResult.value.location) {
        setDisplayName(eventsResult.value.location)
      }
      setEventsStatus('success')
    } else {
      setEventsStatus('error')
    }
  }, [record, dateRange])

  // Pick a random city from the curated list and explore it
  const handleSurprise = () => {
    const city = SURPRISE_CITIES[Math.floor(Math.random() * SURPRISE_CITIES.length)]
    setActiveTab('playbook')
    search({ city, displayName: city })
  }

  // Re-fetch only events when the date filter changes (playbook + tips are
  // date-agnostic so no need to reload them)
  const handleDateChange = async (range) => {
    setDateRange(range)
    if (!lastSearch) return
    setEventsStatus('loading')
    setEvents([])
    try {
      const data = await getEvents({
        ...lastSearch,
        start_date: range.start_date,
        end_date: range.end_date,
        size: 24,
      })
      setEvents(data.events || [])
      setEventsStatus('success')
    } catch {
      setEventsStatus('error')
    }
  }

  const filteredTips = tipFilter
    ? tips.filter(t => t.category?.toLowerCase() === tipFilter.toLowerCase())
    : tips

  const hasResults = playbookStatus === 'success' || tipsStatus === 'success' || eventsStatus === 'success'
  const isLoading = playbookStatus === 'loading'

  // Hide map background once anything has loaded or is loading
  const isActive = hasResults || isLoading

  return (
    <div className={`${styles.page} ${isActive ? styles.pageActive : ''}`}>
      <Header />
      <main className={styles.main}>

        <section className={styles.searchSection}>
          <h1 className={styles.heading}><span>✈️</span> Wander Mode</h1>
          <p className={styles.sub}>Your local guide + events + insider tips for any city on Earth</p>
          <LocationSearch
            onSearch={search}
            loading={isLoading}
            accentColor="amber"
            buttonLabel="Explore"
          />
          {hasResults && (activeTab === 'events' || activeTab === 'stay') && (
            <DateFilter value={dateRange} onChange={handleDateChange} accentColor="amber" />
          )}
        </section>

        {hasResults && (
          <section className={styles.content}>
            <div className={styles.tabs}>
              <button className={`${styles.tab} ${activeTab === 'playbook' ? styles.tabActive : ''}`} onClick={() => setActiveTab('playbook')}>
                📖 <span className={styles.tabFull}>The Local </span>Playbook
              </button>
              <button className={`${styles.tab} ${activeTab === 'events' ? styles.tabActive : ''}`} onClick={() => setActiveTab('events')}>
                🎟️ Events
                {events.length > 0 && <span className={styles.badge}>{events.length}</span>}
              </button>
              <button className={`${styles.tab} ${activeTab === 'stay' ? styles.tabActive : ''}`} onClick={() => setActiveTab('stay')}>
                🛏️ Stay
              </button>
              <button className={`${styles.tab} ${activeTab === 'tips' ? styles.tabActive : ''}`} onClick={() => setActiveTab('tips')}>
                💬 <span className={styles.tabFull}>Community </span>Tips
                {tips.length > 0 && <span className={styles.badge}>{tips.length}</span>}
              </button>
            </div>

            {/* Playbook tab */}
            {activeTab === 'playbook' && (
              <div className={styles.briefingWrap}>
                {playbookStatus === 'loading' && (
                  <div className={styles.stateBox}>
                    <div className={styles.globeSpinner}>🌍</div>
                    <p>Building your local guide for {displayName}…</p>
                    <p className={styles.stateSub}>This takes 5–10 seconds</p>
                  </div>
                )}
                {playbookStatus === 'error' && (
                  <div className={styles.stateBox}>
                    <span className={styles.stateIcon}>⚠️</span>
                    <p>Couldn't generate your guide — check your OpenAI key.</p>
                  </div>
                )}
                {playbookStatus === 'success' && (
                  <div className={styles.briefing}>
                    <div className={styles.briefingHeader}>
                      <h2 className={styles.cityTitle}>{displayName}</h2>
                      <div className={styles.briefingActions}>
                        <span className={styles.aiTag}>✨ AI Generated</span>
                        <button
                          type="button"
                          className={styles.shareBtn}
                          onClick={handleSharePlaybook}
                          aria-label="Share this playbook"
                          title="Share this playbook"
                        >
                          ↗ Share
                        </button>
                      </div>
                    </div>
                    <div className={styles.markdown}>
                      <ReactMarkdown>{briefing}</ReactMarkdown>
                    </div>
                    {shareToast && <div className={styles.shareToast}>{shareToast}</div>}
                  </div>
                )}
              </div>
            )}

            {/* Events tab */}
            {activeTab === 'events' && (
              <div className={styles.eventsWrap}>
                {eventsStatus === 'loading' && (
                  <div className={styles.stateBox}>
                    <div className={styles.bigSpinner} />
                    <p>Finding events in {displayName}…</p>
                  </div>
                )}
                {eventsStatus === 'error' && (
                  <div className={styles.stateBox}>
                    <span className={styles.stateIcon}>⚠️</span>
                    <p>Couldn't load events for {displayName}.</p>
                  </div>
                )}
                {eventsStatus === 'success' && events.length === 0 && (
                  <div className={styles.stateBox}>
                    <span className={styles.stateIcon}>🎟️</span>
                    <p className={styles.stateTitle}>No upcoming events found</p>
                    <p className={styles.stateSub}>Try a different city or check back closer to your travel dates.</p>
                  </div>
                )}
                {eventsStatus === 'success' && events.length > 0 && (
                  <>
                    <div className={styles.eventsBar}>
                      <p className={styles.resultsMeta}>
                        {events.length} upcoming event{events.length !== 1 ? 's' : ''} in <strong>{displayName}</strong>
                      </p>
                      <div className={styles.viewToggle}>
                        <button
                          type="button"
                          className={`${styles.viewBtn} ${eventsView === 'grid' ? styles.viewActive : ''}`}
                          onClick={() => setEventsView('grid')}
                        >▦ Grid</button>
                        <button
                          type="button"
                          className={`${styles.viewBtn} ${eventsView === 'calendar' ? styles.viewActive : ''}`}
                          onClick={() => setEventsView('calendar')}
                        >🗓️ Calendar</button>
                        <button
                          type="button"
                          className={`${styles.viewBtn} ${eventsView === 'map' ? styles.viewActive : ''}`}
                          onClick={() => setEventsView('map')}
                        >🗺️ Map</button>
                      </div>
                    </div>
                    {eventsView === 'grid' && (
                      <div className={styles.eventsGrid}>
                        {events.map(event => <EventCard key={event.id} event={event} />)}
                      </div>
                    )}
                    {eventsView === 'calendar' && (
                      <CalendarView events={events} accentColor="amber" targetDate={dateRange.start_date} />
                    )}
                    {eventsView === 'map' && <MapView events={events} />}
                  </>
                )}
              </div>
            )}

            {/* Stay tab */}
            {activeTab === 'stay' && (
              <Accommodations city={displayName} dateRange={dateRange} mode="wander" accentColor="amber" />
            )}

            {/* Tips tab — read-only on Nomad; locals add tips via Local mode */}
            {activeTab === 'tips' && (
              <div className={styles.tipsWrap}>
                <p className={styles.tipsIntroNomad}>
                  Tips from locals and travelers who've been to <strong>{displayName}</strong>.
                  Want to contribute your own? Switch to <strong>Local</strong> mode when you're in your home city.
                </p>
                <div className={styles.tipFilters}>
                  <button className={`${styles.filterPill} ${tipFilter === '' ? styles.filterActive : ''}`} onClick={() => setTipFilter('')}>All</button>
                  {TIP_CATEGORIES.map(c => (
                    <button key={c} className={`${styles.filterPill} ${tipFilter === c ? styles.filterActive : ''}`} onClick={() => setTipFilter(tipFilter === c ? '' : c)}>{c}</button>
                  ))}
                </div>

                {tipsStatus === 'success' && filteredTips.length === 0 && (
                  <div className={styles.stateBox}>
                    <span className={styles.stateIcon}>🗺️</span>
                    <p className={styles.stateTitle}>No tips yet for {displayName}</p>
                    <p className={styles.stateSub}>Once locals start sharing, their insider knowledge shows up here.</p>
                  </div>
                )}
                <div className={styles.tipsList}>
                  {filteredTips.map(tip => <TipCard key={tip.id} tip={tip} accentColor="amber" />)}
                </div>
              </div>
            )}
          </section>
        )}

        {!hasResults && !isLoading && (
          <div className={styles.idleHint}>
            <span className={styles.idleGlobe}>🌍</span>
            <p>Search any city to get the full Wander experience</p>
            <div className={styles.idleExamples}>
              {['Tokyo', 'Buenos Aires', 'Marrakech', 'Tbilisi', 'Medellín'].map(c => (
                <button key={c} className={styles.exampleChip} onClick={() => search({ city: c, displayName: c })}>{c}</button>
              ))}
            </div>
            <button type="button" className={styles.surpriseBtn} onClick={handleSurprise}>
              🎲 Surprise me
            </button>
          </div>
        )}

        <Footer />
      </main>
    </div>
  )
}
