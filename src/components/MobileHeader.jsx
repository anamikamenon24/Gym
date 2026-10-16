import Logo from './Logo'
import ThemeToggle from './ThemeToggle'
import UserMenu from './UserMenu'

export default function MobileHeader() {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line/[0.06] bg-bg/70 px-4 py-3 backdrop-blur-xl md:hidden">
      <Logo size="sm" />
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserMenu compact />
      </div>
    </header>
  )
}
