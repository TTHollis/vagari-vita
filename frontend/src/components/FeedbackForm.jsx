import { useState } from 'react'
import styles from './FeedbackForm.module.css'

// Vagari Vita's dedicated Formspree endpoint — submissions go directly to inbox.
const FORMSPREE_URL = 'https://formspree.io/f/xpqnjjdp'

export default function FeedbackForm() {
  const [status, setStatus] = useState('idle')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const form = e.target
    const data = new FormData(form)
    data.append('source', 'Vagari Vita')

    setStatus('sending')
    try {
      const response = await fetch(FORMSPREE_URL, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      })
      if (response.ok) {
        setStatus('success')
        form.reset()
        setTimeout(() => setStatus('idle'), 4500)
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className={styles.card}>
      <h3 className={styles.heading}>
        <span>💬</span> Share Your Feedback
      </h3>
      <p className={styles.subtitle}>
        Bug, idea, or general thought? We'd love to hear it.
      </p>

      {status === 'success' && (
        <p className={styles.success}>✅ Thanks! Your feedback has been received.</p>
      )}
      {status === 'error' && (
        <p className={styles.error}>❌ Something went wrong. Please try again.</p>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          name="name"
          placeholder="Your name (optional)"
          className={styles.input}
          autoComplete="name"
        />
        <input
          type="email"
          name="email"
          placeholder="Your email (optional)"
          className={styles.input}
          autoComplete="email"
        />
        <textarea
          name="message"
          placeholder="What's on your mind?"
          required
          rows={4}
          className={styles.textarea}
        />
        <button
          type="submit"
          disabled={status === 'sending'}
          className={styles.submitBtn}
        >
          {status === 'sending' ? 'Sending…' : 'Send Feedback'}
        </button>
      </form>
    </div>
  )
}
