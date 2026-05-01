import { ReactNode } from 'react'
import TopNav from './TopNav'
import SubNav from './SubNav'
import { useLocation } from 'wouter'

const VIEW_PATHS = ['/view/', '/person/']

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation()
  const showSubNav = VIEW_PATHS.some(p => location.startsWith(p)) || location === '/'

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav />
      {showSubNav && <SubNav />}
      <main className="flex-1 px-4 py-4 max-w-6xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
