import { Link, useLocation } from 'wouter'
import { useAuth } from '@/hooks/useAuth'
import { signOut } from '@/lib/auth'
import { useState } from 'react'

export default function TopNav() {
  const { user, role, viewAs, setViewAs } = useAuth()
  const [location] = useLocation()
  const [search, setSearch] = useState('')

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/login'
  }

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'View', href: '/view/family', active: location.startsWith('/view') },
    { label: 'People', href: '/view/names' },
    { label: 'Media', href: '/media' },
    { label: 'Tools', href: '/tools' },
    { label: 'Edit', href: '/edit' },
  ]

  const displayName = user?.email?.split('@')[0] ?? 'User'

  return (
    <div>
      {/* Top status bar */}
      <div className="flex items-center justify-end gap-4 px-4 py-1 text-xs bg-background border-b border-border">
        {role === 'admin' && (
          <span>
            View as:{' '}
            <button
              onClick={() => setViewAs('member')}
              className={`hover:underline ${viewAs === 'member' ? 'font-bold' : ''}`}
              style={{ color: 'hsl(var(--primary))' }}
            >
              family member
            </button>
            {' | '}
            <button
              onClick={() => setViewAs('admin')}
              className={`hover:underline ${viewAs === 'admin' ? 'font-bold' : ''}`}
              style={{ color: viewAs === 'admin' ? '#333' : 'hsl(var(--primary))' }}
            >
              admin
            </button>
          </span>
        )}
        <span className="text-foreground">
          {displayName} :{' '}
          <Link href="/account" className="font-bold">
            My Account
          </Link>
        </span>
        <button onClick={handleSignOut} className="hover:underline" style={{ color: 'hsl(var(--primary))' }}>
          Sign Out
        </button>
      </div>

      {/* Main nav bar */}
      <nav className="flex items-center" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="flex flex-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="px-5 py-3 text-sm font-medium transition-colors"
              style={{
                color: item.active || location === item.href
                  ? '#f5a623'
                  : '#e0e0e0',
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center pr-3">
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-none border-0 outline-none"
            style={{ width: 200, backgroundColor: '#f5f5f5' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && search.trim()) {
                window.location.href = `/view/names?search=${encodeURIComponent(search)}`
              }
            }}
          />
          <button
            style={{ backgroundColor: '#555', color: '#fff', padding: '7px 10px' }}
            onClick={() => {
              if (search.trim()) {
                window.location.href = `/view/names?search=${encodeURIComponent(search)}`
              }
            }}
          >
            🔍
          </button>
        </div>
      </nav>
    </div>
  )
}
