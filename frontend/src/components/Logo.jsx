export default function Logo({ size = 64, className = '' }) {
  return (
    <img
      src="/logo.jpeg"
      alt="Vagari Vita — Wander Life. Wander Culture."
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain', borderRadius: 8 }}
    />
  )
}
