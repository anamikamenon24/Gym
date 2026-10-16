import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { CardSkeleton } from './Skeleton'
import ErrorState from './ErrorState'

export default function RequireAuth() {
  const { user, loading, error, refresh } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="mx-auto grid max-w-6xl gap-4 px-4 pt-10 sm:px-6 lg:grid-cols-3 lg:px-10">
        <CardSkeleton className="h-56 lg:col-span-2" />
        <CardSkeleton className="h-56" />
      </div>
    )
  }
  if (error && !user) {
    return (
      <div className="mx-auto max-w-xl px-4 pt-10">
        <ErrorState error={error} onRetry={refresh} />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}
