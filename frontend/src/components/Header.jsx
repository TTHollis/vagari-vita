import { useNavigate, useLocation } from 'react-router-dom'
import { useFavorites } from '../hooks/useFavorites'
import styles from './Header.module.css'

export default function Header() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { favorites } = useFavorites()
  const isHome = pathname === '/'

  return (
    <header className={styles.header}>
      <button className={styles.brand} onClick={() => navigate('/')} aria-label="Home">
        <img src="/icons/icon-192.png" alt="" className={styles.headerLogo} />
        <span className={styles.wordmark}>
          <span style={{ color: '#2E9E4F' }}>Vagari</span>
          <span style={{ color: '#E8742C' }}>Vita</span>
        </span>
      </button>
      <nav className={styles.nav}>
        {!isHome && (
          <>
            <button
              className={`${styles.pill} ${pathname === '/local' ? styles.active : ''}`}
              onClick={() => navigate('/local')}
            >
              Local
            </button>
            <button
              className={`${styles.pill} ${pathname === '/nomad' ? styles.active : ''}`}
              onClick={() => navigate('/nomad')}
            >
              Wander
            </button>
          </>
        )}
        <button
          className={`${styles.savedBtn} ${pathname === '/saved' ? styles.active : ''}`}
          onClick={() => navigate('/saved')}
          aria-label="Saved events"
          title="Saved events"
        >
          <span className={styles.starIcon}>⭐</span>
          {favorites.length > 0 && (
            <span className={styles.countBadge}>{favorites.length}</span>
          )}
        </button>
      </nav>
    </header>
  )
}
