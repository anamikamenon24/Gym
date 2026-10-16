import { createContext, useContext, useMemo, useState } from 'react'
import { user as mockProfile } from '../data/mockData'
import { useAuth } from './AuthContext'

const AppContext = createContext(null)

// Real identity comes from the logged-in account; screens not yet on the database
// (Progress, Classes, Profile extras) still read their mock fields from mockProfile.
export function AppProvider({ children }) {
  const { user: authUser } = useAuth()
  const [bookings, setBookings] = useState([])

  const toggleBooking = (id) => setBookings((b) => (b.includes(id) ? b.filter((x) => x !== id) : [...b, id]))

  const user = useMemo(
    () =>
      authUser
        ? {
            ...mockProfile,
            name: authUser.name,
            fullName: authUser.fullName,
            initials: authUser.initials,
            handle: authUser.email,
            streak: authUser.streak ?? 0,
            memberSince: new Date(authUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          }
        : null,
    [authUser],
  )

  return <AppContext.Provider value={{ user, bookings, toggleBooking }}>{children}</AppContext.Provider>
}

export const useApp = () => useContext(AppContext)
