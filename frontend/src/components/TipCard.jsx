import { useState } from 'react'
import { upvoteTip, reportTip } from '../services/api'
import { useLocalStorage } from '../hooks/useLocalStorage'
import styles from './TipCard.module.css'

const CATEGORY_ICONS = {
  general: '💬',
  food: '🍜',
  transport: '🚇',
  safety: '🛡️',
  etiquette: '🤝',
  nightlife: '🌙',
  'hidden gems': '💎',
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso)
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function TipCard({ tip, accentColor = 'green' }) {
  const icon = CATEGORY_ICONS[tip.category?.toLowerCase()] || '💬'
  const accent = accentColor === 'amber' ? styles.amber : styles.green

  // Track which tips this browser has already acted on, so buttons lock
  const [upvotedIds, setUpvotedIds] = useLocalStorage('urban-nomad.upvoted-tips', [])
  const [reportedIds, setReportedIds] = useLocalStorage('urban-nomad.reported-tips', [])

  const hasUpvoted = upvotedIds.includes(tip.id)
  const hasReported = reportedIds.includes(tip.id)

  const [count, setCount] = useState(tip.upvotes || 0)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportDone, setReportDone] = useState(hasReported)

  const handleUpvote = async () => {
    if (hasUpvoted) return
    setCount(c => c + 1) // optimistic
    setUpvotedIds(ids => [...ids, tip.id])
    try {
      const res = await upvoteTip(tip.id)
      if (typeof res.upvotes === 'number') setCount(res.upvotes)
    } catch {
      // revert on failure
      setCount(c => Math.max(0, c - 1))
      setUpvotedIds(ids => ids.filter(i => i !== tip.id))
    }
  }

  const handleReport = async () => {
    setReportOpen(false)
    setReportDone(true)
    setReportedIds(ids => [...ids, tip.id])
    try {
      await reportTip(tip.id)
    } catch {
      // keep it marked reported locally even if the call hiccups; harmless
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <span className={styles.icon}>{icon}</span>
        <span className={styles.category}>{tip.category}</span>
        <span className={styles.time}>{timeAgo(tip.created_at)}</span>
      </div>
      <p className={styles.content}>{tip.content}</p>
      <div className={styles.footer}>
        <p className={styles.author}>— {tip.author_handle}</p>
        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.upvoteBtn} ${accent} ${hasUpvoted ? styles.upvoted : ''}`}
            onClick={handleUpvote}
            disabled={hasUpvoted}
            title={hasUpvoted ? 'You found this helpful' : 'Mark as helpful'}
          >
            👍 <span className={styles.upvoteCount}>{count}</span>
          </button>

          {reportDone ? (
            <span className={styles.reportedTag}>Reported ✓</span>
          ) : reportOpen ? (
            <span className={styles.reportConfirm}>
              Report this tip?
              <button type="button" className={styles.reportYes} onClick={handleReport}>Yes</button>
              <button type="button" className={styles.reportNo} onClick={() => setReportOpen(false)}>No</button>
            </span>
          ) : (
            <button
              type="button"
              className={styles.reportBtn}
              onClick={() => setReportOpen(true)}
              title="Report inappropriate content"
            >
              ⚐ Report
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
