import { useNavigate } from 'react-router-dom'
import Footer from '../components/Footer'
import styles from './Home.module.css'

const MODES = [
  {
    id: 'local',
    label: 'Local',
    emoji: '📍',
    headline: 'Your City, Right Now',
    description: 'Discover concerts, festivals, markets, and happenings within your city — powered by Ticketmaster and Eventbrite.',
    cta: 'Explore Locally',
    accent: '#27AE60',
    gradient: 'linear-gradient(135deg, #1a4a2e 0%, #0F1A35 100%)',
    features: ['Live event listings', 'Filter by category & date', 'Venue maps & details'],
  },
  {
    id: 'nomad',
    label: 'Wander',
    emoji: '✈️',
    headline: 'Go Anywhere, Know Everything',
    description: 'AI-generated local guides for any city on Earth, plus unfiltered tips from fellow travelers.',
    cta: 'Start Exploring',
    accent: '#F39C12',
    gradient: 'linear-gradient(135deg, #3a2a0a 0%, #0F1A35 100%)',
    features: ['AI local guides', 'Community local tips', 'Etiquette & insider knowledge'],
  },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.logoWrap}>
          <img
            src="/VagariVita.png"
            alt="Vagari Vita — Wander Life. Wander Culture."
            className={styles.logoImg}
          />
        </div>
      </div>

      {/* Mode selector */}
      <div className={styles.selector}>
        <p className={styles.prompt}>Choose your mode</p>
        <div className={styles.cards}>
          {MODES.map(mode => (
            <button
              key={mode.id}
              className={styles.card}
              style={{ background: mode.gradient, '--accent': mode.accent }}
              onClick={() => navigate(`/${mode.id}`)}
            >
              <div className={styles.cardInner}>
                <span className={styles.cardEmoji}>{mode.emoji}</span>
                <div className={styles.cardBadge} style={{ color: mode.accent, borderColor: mode.accent }}>
                  {mode.label}
                </div>
                <h2 className={styles.cardHeadline}>{mode.headline}</h2>
                <p className={styles.cardDesc}>{mode.description}</p>
                <ul className={styles.features}>
                  {mode.features.map(f => (
                    <li key={f} className={styles.feature}>
                      <span className={styles.featureDot} style={{ background: mode.accent }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className={styles.cta} style={{ background: mode.accent }}>
                  {mode.cta} →
                </div>
              </div>
              <div className={styles.cardGlow} style={{ background: mode.accent }} />
            </button>
          ))}
        </div>
      </div>

      <footer className={styles.footer}>
        <span>No account needed &nbsp;·&nbsp; Always free</span>
      </footer>

      <Footer />
    </div>
  )
}
