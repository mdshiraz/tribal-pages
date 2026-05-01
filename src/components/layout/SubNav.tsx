import { Link, useLocation } from 'wouter'

const views = [
  { label: 'Names', href: '/view/names' },
  { label: 'Tree', href: '/view/tree' },
  { label: 'Family', href: '/view/family' },
  { label: 'Ancestors', href: '/view/ancestors' },
  { label: 'Descendants', href: '/view/descendants' },
  { label: 'Kin', href: '/view/kin' },
  { label: 'Reports', href: '/view/reports' },
  { label: 'Printable', href: '/view/printable' },
]

export default function SubNav() {
  const [location] = useLocation()

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-border">
      {views.map((v) => {
        const isActive = location.startsWith(v.href)
        return (
          <Link
            key={v.label}
            href={v.href}
            className="px-2 py-0.5 text-sm font-medium"
            style={{
              color: isActive ? '#000' : 'hsl(var(--primary))',
              fontWeight: isActive ? '700' : '400',
              textDecoration: 'none',
            }}
          >
            {v.label}
          </Link>
        )
      })}
    </div>
  )
}
