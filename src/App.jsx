import { Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import AppLayout from './components/AppLayout'
import RequireAuth from './components/RequireAuth'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Library from './pages/Library'
import LiveWorkout from './pages/LiveWorkout'
import Progress from './pages/Progress'
import Classes from './pages/Classes'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'
import { Login, Signup } from './pages/AuthPages'

export default function App() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
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
  )
}
