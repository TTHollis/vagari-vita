import { useState, useEffect, useCallback } from 'react'
import Header from '../components/Header'
import { adminGetSummary, adminGetTips, adminRestoreTip, adminDeleteTip } from '../services/api'
import styles from './Admin.module.css'

const TABS = [
  { id: 'flagged', label: '⚑ Flagged', hint: 'Community-reported, auto-hidden' },
  { id: 'rejected', label: '🤖 AI-Rejected', hint: 'Blocked by moderation' },
  { id: 'approved', label: '✓ Approved', hint: 'Live on the site' },
]

export default function Admin() {
  // Token persists for the session only (cleared when tab closes)
  const [token, setToken] = useState(() => sessionStorage.getItem('un-admin-token') || '')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')
  const [tab, setTab] = useState('flagged')
  const [summary, setSummary] = useState(null)
  const [tips, setTips] = useState([])
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState(null)

  const loadTab = useCallback(async (tk, status) => {
    setLoading(true)
    try {
      const [sum, list] = await Promise.all([
        adminGetSummary(tk),
        adminGetTips(tk, status),
      ])
      setSummary(sum)
      setTips(list.tips || [])
      setAuthed(true)
      setAuthError('')
      sessionStorage.setItem('un-admin-token', tk)
    } catch (err) {
      setAuthed(false)
      setAuthError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }, [])

  // If a token is already cached, try it on mount
  useEffect(() => {
    if (token) loadTab(token, tab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogin = (e) => {
    e.preventDefault()
    if (token.trim()) loadTab(token.trim(), tab)
  }

  const switchTab = (id) => {
    setTab(id)
    loadTab(token, id)
  }

  const handleRestore = async (id) => {
    setBusyId(id)
    try {
      await adminRestoreTip(token, id)
      setTips(ts => ts.filter(t => t.id !== id))
      const sum = await adminGetSummary(token)
      setSummary(sum)
    } catch (err) {
      alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this tip? This cannot be undone.')) return
    setBusyId(id)
    try {
      await adminDeleteTip(token, id)
      setTips(ts => ts.filter(t => t.id !== id))
      const sum = await adminGetSummary(token)
      setSummary(sum)
    } catch (err) {
      alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('un-admin-token')
    setToken('')
    setAuthed(false)
    setTips([])
    setSummary(null)
  }

  // --- Login gate ---
  if (!authed) {
    return (
      <div className={styles.page}>
        <Header />
        <main className={styles.gateMain}>
          <form className={styles.gate} onSubmit={handleLogin}>
            <span className={styles.lockIcon}>🔒</span>
            <h1 className={styles.gateTitle}>Admin Access</h1>
            <p className={styles.gateSub}>Enter the admin token to manage community tips.</p>
            <input
              type="password"
              className={styles.tokenInput}
              placeholder="Admin token"
              value={token}
              onChange={e => setToken(e.target.value)}
              autoFocus
            />
            <button type="submit" className={styles.gateBtn} disabled={loading || !token.trim()}>
              {loading ? 'Checking…' : 'Unlock'}
            </button>
            {authError && <p className={styles.gateError}>⚠️ {authError}</p>}
          </form>
        </main>
      </div>
    )
  }

  // --- Dashboard ---
  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <div className={styles.topRow}>
          <h1 className={styles.heading}>🛡️ Tip Moderation</h1>
          <button className={styles.logoutBtn} onClick={handleLogout}>Lock</button>
        </div>

        <div className={styles.tabs}>
          {TABS.map(t => (
            <button
              key={t.id}
              className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
              onClick={() => switchTab(t.id)}
            >
              {t.label}
              {summary && <span className={styles.count}>{summary[t.id] ?? 0}</span>}
            </button>
          ))}
        </div>
        <p className={styles.tabHint}>{TABS.find(t => t.id === tab)?.hint}</p>

        {loading ? (
          <div className={styles.stateBox}><div className={styles.spinner} /><p>Loading…</p></div>
        ) : tips.length === 0 ? (
          <div className={styles.stateBox}>
            <span className={styles.emptyIcon}>✨</span>
            <p>Nothing here — queue is clear.</p>
          </div>
        ) : (
          <div className={styles.list}>
            {tips.map(t => (
              <div key={t.id} className={styles.tipRow}>
                <div className={styles.tipMeta}>
                  <span className={styles.tipCity}>{t.city}</span>
                  <span className={styles.tipCat}>{t.category}</span>
                  {t.report_count > 0 && <span className={styles.reportBadge}>🚩 {t.report_count} reports</span>}
                  {t.rejection_categories.length > 0 && (
                    <span className={styles.aiBadge}>🤖 {t.rejection_categories.filter(Boolean).join(', ')}</span>
                  )}
                </div>
                <p className={styles.tipContent}>{t.content}</p>
                <div className={styles.tipFooter}>
                  <span className={styles.tipAuthor}>— {t.author_handle}</span>
                  <div className={styles.tipActions}>
                    {tab !== 'approved' && (
                      <button
                        className={styles.restoreBtn}
                        onClick={() => handleRestore(t.id)}
                        disabled={busyId === t.id}
                      >
                        Approve
                      </button>
                    )}
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(t.id)}
                      disabled={busyId === t.id}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
