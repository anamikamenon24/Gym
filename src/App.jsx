import { Route, Routes, useLocation } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import AppLayout from './components/AppLayout'
import RequireAuth from './components/RequireAuth'
import Landing from './pages/Landing'
import { Login, Signup } from './pages/AuthPages' // small, and often the first page — no extra round trip

// Everything else loads on demand, so the first visit doesn't download charts, confetti etc.
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Library = lazy(() => import('./pages/Library'))
const LiveWorkout = lazy(() => import('./pages/LiveWorkout'))
const Progress = lazy(() => import('./pages/Progress'))
const Classes = lazy(() => import('./pages/Classes'))
const Profile = lazy(() => import('./pages/Profile'))
const NotFound = lazy(() => import('./pages/NotFound'))

export default function App() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <Suspense fallback={<div className="min-h-dvh bg-bg" />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route element={<AppLayout />}>
          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/library" element={<Library />} />
            <Route path="/workout" element={<LiveWorkout />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="/progress" element={<Progress />} />
          <Route path="/classes" element={<Classes />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
