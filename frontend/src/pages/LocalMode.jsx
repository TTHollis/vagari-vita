import { useState, useCallback } from 'react'
import Header from '../components/Header'
import EventCard from '../components/EventCard'
import TipCard from '../components/TipCard'
import LocationSearch from '../components/LocationSearch'
import DateFilter from '../components/DateFilter'
import CalendarView from '../components/CalendarView'
import MapView from '../components/MapView'
import Footer from '../components/Footer'
import { getEvents, getTips, addTip } from '../services/api'
import { useRecentSearches } from '../hooks/useRecentSearches'
import styles from './LocalMode.module.css'

const CATEGORIES = [
  { label: 'All', value: '' },
  { label: '🎵 Music', value: 'Music' },
  { label: '⚽ Sports', value: 'Sports' },
  { label: '🎭 Arts', value: 'Arts & Theatre' },
  { label: '😂 Comedy', value: 'Comedy' },
  { label: '👨‍👩‍👧 Family', value: 'Family' },
]

const TIP_CATEGORIES = ['General', 'Food', 'Transport', 'Safety', 'Etiquette', 'Nightlife', 'Hidden Gems']
const INITIAL_FORM = { category: 'General', content: '', author_handle: '' }

export default function LocalMode() {
  const [activeTab, setActiveTab] = useState('events')
  const [category, setCategory] = useState('')
  const [dateRange, setDateRange] = useState({ preset: 'any', start_date: undefined, end_date: undefined })
  const [view, setView] = useState('grid')
  const [events, setEvents] = useState([])
  const [tips, setTips] = useState([])
  const [tipFilter, setTipFilter] = useState('')
  const [status, setStatus] = useState('idle')
  const [tipsStatus, setTipsStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [lastSearch, setLastSearch] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [formStatus, setFormStatus] = useState('idle')
  const [formError, setFormError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const { record } = useRecentSearches()

  const runSearch = useCallback(async (searchParams, label, cat, range) => {
    setStatus('loading')
    setTipsStatus('loading')
    setErrorMsg('')
    setDisplayName(label)
    setLastSearch(searchParams)
    setEvents([])
    setTips([])
    try {
      const [eventsRes, tipsRes] = await Promise.allSettled([
        getEvents({ ...searchParams, category: cat, start_date: range.start_date, end_date: range.end_date, size: 24 }),
        getTips(label),
      ])
      if (eventsRes.status === 'fulfilled') {
        setEvents(eventsRes.value.events || [])
        setStatus('success')
      } else {
        setErrorMsg(eventsRes.reason?.message || 'Could not load events')
        setStatus('error')
      }
      if (tipsRes.status === 'fulfilled') {
        setTips(tipsRes.value.tips || [])
        setTipsStatus('success')
      } else {
        setTipsStatus('error')
      }
      record({ ...searchParams, displayName: label })
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong')
      setStatus('error')
      setTipsStatus('error')
    }
  }, [record])

  const search = useCallback(({ city, state, zip_code, displayName: name } = {}) => {
    const isNewSearch = city !== undefined || zip_code !== undefined
    const searchParams = isNewSearch ? { city, state, zip_code } : lastSearch
    if (!searchParams) return
    const label = name || displayName
    runSearch(searchParams, label, category, dateRange)
  }, [lastSearch, displayName, category, dateRange, runSearch])

  const handleCategoryChange = (val) => {
    setCategory(val)
    if (lastSearch) runSearch(lastSearch, displayName, val, dateRange)
  }

  const handleDateChange = (range) => {
    setDateRange(range)
    if (lastSearch) runSearch(lastSearch, displayName, category, range)
  }

  const submitTip = async (e) => {
    e.preventDefault()
    if (!form.content.trim()) return
    setFormStatus('loading')
    setFormError('')
    try {
      await addTip({ ...form, city: displayName, category: form.category.toLowerCase() })
      const data = await getTips(displayName)
      setTips(data.tips || [])
      setForm(INITIAL_FORM)
      setShowForm(false)
      setFormStatus('idle')
    } catch (err) {
      const msg = err?.message || ''
      if (msg.toLowerCase().includes('community standards')) {
        setFormError(msg)
      } else {
        setFormError('Failed to post — try again.')
      }
      setFormStatus('error')
    }
  }

  const filteredTips = tipFilter
    ? tips.filter(t => t.category?.toLowerCase() === tipFilter.toLowerCase())
    : tips

  const isActive = status !== 'idle'

  return (
    <div className={`${styles.page} ${isActive ? styles.pageActive : ''}`}>
      <Header />
      <main className={styles.main}>

        <section className={styles.searchSection}>
          <h1 className={styles.heading}><span className={styles.pin}>📍</span> Local Events</h1>
          <p className={styles.sub}>Find what's happening — share what you know — search by city or zip code</p>
          <LocationSearch onSearch={search} loading={status === 'loading'} accentColor="green" buttonLabel="Search" />
          {activeTab === 'events' && (
            <>
              <div className={styles.filters}>
                {CATEGORIES.map(c => (
                  <button
                    key={c.value}
                    className={`${styles.filterPill} ${category === c.value ? styles.filterActive : ''}`}
                    onClick={() => handleCategoryChange(c.value)}
                    type="button"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <DateFilter value={dateRange} onChange={handleDateChange} accentColor="green" />
            </>
          )}
        </section>

        {/* Tabs only appear once a search has been run */}
        {isActive && (
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'events' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('events')}
            >
              🎟️ Events
              {events.length > 0 && <span className={styles.badge}>{events.length}</span>}
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'tips' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('tips')}
            >
              💬 <span className={styles.tabFull}>Local </span>Tips
              {tips.length > 0 && <span className={styles.badge}>{tips.length}</span>}
            </button>
          </div>
        )}

        {/* EVENTS TAB */}
        {activeTab === 'events' && (
          <>
            {status === 'loading' && (
              <div className={styles.stateBox}>
                <div className={styles.bigSpinner} />
                <p>Searching events in {displayName}…</p>
              </div>
            )}

            {status === 'error' && (
              <div className={styles.stateBox}>
                <span className={styles.stateIcon}>⚠️</span>
                <p className={styles.stateTitle}>Couldn't load events</p>
                <p className={styles.stateSub}>{errorMsg}</p>
                <button className={styles.retryBtn} onClick={() => search()}>Try again</button>
              </div>
            )}

            {status === 'success' && events.length === 0 && (
              <div className={styles.stateBox}>
                <span className={styles.stateIcon}>🔍</span>
                <p className={styles.stateTitle}>No events found</p>
                <p className={styles.stateSub}>Try a different city, zip code, category, or date range.</p>
              </div>
            )}

            {status === 'success' && events.length > 0 && (
              <section className={styles.results}>
                <div className={styles.resultsBar}>
                  <p className={styles.resultsMeta}>
                    {events.length} event{events.length !== 1 ? 's' : ''} in <strong>{displayName}</strong>
                    {category && ` · ${category}`}
                  </p>
                  <div className={styles.viewToggle}>
                    <button
                      type="button"
                      className={`${styles.viewBtn} ${view === 'grid' ? styles.viewActive : ''}`}
                      onClick={() => setView('grid')}
                    >
                      ▦ Grid
                    </button>
                    <button
                      type="button"
                      className={`${styles.viewBtn} ${view === 'calendar' ? styles.viewActive : ''}`}
                      onClick={() => setView('calendar')}
                    >
                      🗓️ Calendar
                    </button>
                    <button
                      type="button"
                      className={`${styles.viewBtn} ${view === 'map' ? styles.viewActive : ''}`}
                      onClick={() => setView('map')}
                    >
                      🗺️ Map
                    </button>
                  </div>
                </div>

                {view === 'grid' && (
                  <div className={styles.grid}>
                    {events.map(event => <EventCard key={event.id} event={event} />)}
                  </div>
                )}
                {view === 'calendar' && (
                  <CalendarView events={events} accentColor="green" targetDate={dateRange.start_date} />
                )}
                {view === 'map' && <MapView events={events} />}
              </section>
            )}
          </>
        )}

        {/* TIPS TAB */}
        {activeTab === 'tips' && isActive && (
          <section className={styles.tipsWrap}>
            <div className={styles.tipsIntro}>
              <h2 className={styles.tipsTitle}>Share what you know about {displayName}</h2>
              <p className={styles.tipsSub}>
                Travelers heading here will see the tips you leave below. Bus routes, dive bars, taco trucks — anything you wish you'd known sooner.
              </p>
              <button
                className={styles.addBtn}
                onClick={() => setShowForm(v => !v)}
                type="button"
              >
                {showForm ? '✕ Cancel' : '+ Share a Tip'}
              </button>
            </div>

            {showForm && (
              <form className={styles.tipForm} onSubmit={submitTip}>
                <select
                  className={styles.select}
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                >
                  {TIP_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <textarea
                  className={styles.textarea}
                  placeholder={`Share an insider tip about ${displayName}…`}
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  rows={3}
                  maxLength={1000}
                  required
                />
                <div className={styles.formRow}>
                  <input
                    className={styles.handleInput}
                    placeholder="Your handle (optional)"
                    value={form.author_handle}
                    onChange={e => setForm(f => ({ ...f, author_handle: e.target.value }))}
                    maxLength={60}
                  />
                  <button
                    className={styles.submitBtn}
                    type="submit"
                    disabled={formStatus === 'loading' || !form.content.trim()}
                  >
                    {formStatus === 'loading' ? <span className={styles.spinner} /> : 'Post Tip'}
                  </button>
                </div>
                <p className={styles.formFinePrint}>
                  By posting, you agree to our{' '}
                  <a
                    href="https://github.com/TTHollis/vagari-vita/blob/master/ETHICS.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.formLink}
                  >community standards</a>.
                  Tips are screened by AI before going live.
                </p>
                {formStatus === 'error' && <p className={styles.formError}>{formError}</p>}
              </form>
            )}

            <div className={styles.tipFilters}>
              <button
                className={`${styles.filterPill} ${tipFilter === '' ? styles.filterActive : ''}`}
                onClick={() => setTipFilter('')}
              >All</button>
              {TIP_CATEGORIES.map(c => (
                <button
                  key={c}
                  className={`${styles.filterPill} ${tipFilter === c ? styles.filterActive : ''}`}
                  onClick={() => setTipFilter(tipFilter === c ? '' : c)}
                >{c}</button>
              ))}
            </div>

            {tipsStatus === 'success' && filteredTips.length === 0 && (
              <div className={styles.stateBox}>
                <span className={styles.stateIcon}>💬</span>
                <p className={styles.stateTitle}>No tips yet for {displayName}</p>
                <p className={styles.stateSub}>Be the first to share something — your city's about to get a little easier for everyone.</p>
              </div>
            )}

            <div className={styles.tipsList}>
              {filteredTips.map(tip => <TipCard key={tip.id} tip={tip} accentColor="green" />)}
            </div>
          </section>
        )}

        {status === 'idle' && (
          <div className={styles.idleHint}>
            <span className={styles.idleIcon}>🌆</span>
            <p>Search any city or zip code to see what's happening and share your local knowledge</p>
          </div>
        )}

        <Footer />
      </main>
    </div>
  )
}
