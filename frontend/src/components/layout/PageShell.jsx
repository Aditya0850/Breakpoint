/**
 * Wraps Setup/Dashboard/Interview/Report so every screen shares the same
 * ambient texture as Landing/Auth, instead of drifting into plain
 * Tailwind-default pages. Keep this the one place that owns that effect.
 */
export default function PageShell({ children, className = '' }) {
  return (
    <div className={`relative min-h-screen bg-base text-primary ${className}`}>
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-40"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
