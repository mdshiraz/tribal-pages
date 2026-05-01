import { useAuth } from '@/hooks/useAuth'

interface AddPlaceholderProps {
  label: string
  href?: string
  onClick?: () => void
}

export default function AddPlaceholder({ label, href, onClick }: AddPlaceholderProps) {
  const { viewAs } = useAuth()
  if (viewAs !== 'admin') return null

  return (
    <div className="add-placeholder" style={{ minWidth: 160 }}>
      {href ? (
        <a href={href} style={{ textDecoration: 'none' }}>
          «&nbsp;<span style={{ color: 'hsl(var(--primary))' }}>{label}</span>&nbsp;»
        </a>
      ) : (
        <button onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          «&nbsp;<span style={{ color: 'hsl(var(--primary))' }}>{label}</span>&nbsp;»
        </button>
      )}
    </div>
  )
}
