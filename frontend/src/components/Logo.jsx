export default function Logo({ size = 64, className = '' }) {
  return (
    <img
      src="/icons/icon-512.png"
      alt="Vagari Vita — Wander Life. Wander Culture."
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain', borderRadius: 8 }}
    />
  )
}
