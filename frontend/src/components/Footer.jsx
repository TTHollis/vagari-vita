import FeedbackForm from './FeedbackForm'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <FeedbackForm />
      <div className={styles.links}>
        <a
          href="https://github.com/TTHollis/vagari-vita/blob/master/ETHICS.md"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          Our Ethics
        </a>
        <span className={styles.dot}>·</span>
        <a
          href="https://github.com/TTHollis/vagari-vita"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          GitHub
        </a>
      </div>
      <p className={styles.disclaimer}>
        Vagari Vita — Wander Life. Wander Culture. AI-generated content is labeled
        and may contain errors; always cross-check anything that matters.
      </p>
    </footer>
  )
}
