import { Suspense } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import MobileHeader from './MobileHeader'
import Footer from './Footer'

export default function AppLayout() {
  const location = useLocation()
  const outlet = useOutlet()

  return (
    <div className="ambient flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader />
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {/* Keeps the sidebar on screen while a page's code loads */}
              <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>{outlet}</Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
        <Footer compact />
      </div>
      <BottomNav />
    </div>
  )
}
