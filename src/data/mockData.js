// Mock data for screens that aren't on the database yet (Progress, Classes, Profile extras).
// Landing stats, Dashboard, Workout Library and Live Workout now load from /api.

export const user = {
  membership: 'Pulse Elite',
  homeGym: 'PulseFit Indiranagar',
  level: 18,
  xp: 7420,
  xpNext: 8000,
  totals: { workouts: 186, hours: 154, prs: 23, classes: 41 },
}

export const quotes = [
  { text: 'The only bad workout is the one that didn’t happen.', author: 'Unknown' },
  { text: 'Strength doesn’t come from what you can do. It comes from overcoming what you once thought you couldn’t.', author: 'Rikki Rogers' },
  { text: 'Discipline is choosing between what you want now and what you want most.', author: 'Abraham Lincoln' },
  { text: 'Sweat is just fat crying.', author: 'Gym wisdom' },
  { text: 'You don’t have to be extreme, just consistent.', author: 'Unknown' },
  { text: 'Take care of your body. It’s the only place you have to live.', author: 'Jim Rohn' },
  { text: 'Success isn’t always about greatness. It’s about consistency.', author: 'Dwayne Johnson' },
]

export const quoteOfTheDay = () => {
  const start = new Date(new Date().getFullYear(), 0, 0)
  const day = Math.floor((Date.now() - start) / 86400000)
  return quotes[day % quotes.length]
}

export const strengthHistory = [
  { week: 'Jul 1', bench: 55, squat: 75, deadlift: 95 },
  { week: 'Jul 15', bench: 57.5, squat: 80, deadlift: 100 },
  { week: 'Jul 29', bench: 57.5, squat: 82.5, deadlift: 105 },
  { week: 'Aug 12', bench: 60, squat: 85, deadlift: 107.5 },
  { week: 'Aug 26', bench: 62.5, squat: 90, deadlift: 112.5 },
  { week: 'Sep 9', bench: 62.5, squat: 92.5, deadlift: 115 },
  { week: 'Sep 23', bench: 65, squat: 95, deadlift: 120 },
  { week: 'Oct 7', bench: 67.5, squat: 100, deadlift: 125 },
]

export const lifts = [
  { key: 'bench', label: 'Bench Press' },
  { key: 'squat', label: 'Back Squat' },
  { key: 'deadlift', label: 'Deadlift' },
]

export const personalRecords = [
  { id: 1, lift: 'Deadlift', value: '125 kg', date: 'Oct 7', delta: '+5 kg', tier: 'gold' },
  { id: 2, lift: 'Back Squat', value: '100 kg', date: 'Oct 7', delta: '+5 kg', tier: 'gold' },
  { id: 3, lift: 'Bench Press', value: '67.5 kg', date: 'Oct 7', delta: '+2.5 kg', tier: 'silver' },
  { id: 4, lift: 'Pull-Ups', value: '14 reps', date: 'Sep 30', delta: '+2 reps', tier: 'silver' },
  { id: 5, lift: '5K Run', value: '24:12', date: 'Sep 18', delta: '−0:48', tier: 'bronze' },
  { id: 6, lift: 'Plank', value: '3:05', date: 'Sep 2', delta: '+0:20', tier: 'bronze' },
]

export const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const classTypes = ['All', 'Yoga', 'HIIT', 'Spin', 'Boxing']

const c = (id, day, time, type, title, coach, duration, spots, capacity, intensity) =>
  ({ id, day, time, type, title, coach, duration, spots, capacity, intensity })

export const classes = [
  c(1, 'Mon', '06:30', 'HIIT', 'Sunrise Shred', 'Kabir R.', 45, 4, 20, 'High'),
  c(2, 'Mon', '08:00', 'Yoga', 'Vinyasa Flow', 'Meera S.', 60, 9, 18, 'Low'),
  c(3, 'Mon', '18:30', 'Boxing', 'Bag Work Basics', 'Arjun D.', 50, 0, 16, 'High'),
  c(4, 'Mon', '19:30', 'Spin', 'Neon Ride', 'Tara K.', 45, 12, 24, 'Medium'),
  c(5, 'Tue', '07:00', 'Spin', 'Climb Club', 'Tara K.', 45, 6, 24, 'High'),
  c(6, 'Tue', '12:30', 'Yoga', 'Lunch Break Stretch', 'Meera S.', 30, 14, 18, 'Low'),
  c(7, 'Tue', '19:00', 'HIIT', 'Tabata Inferno', 'Kabir R.', 40, 2, 20, 'High'),
  c(8, 'Wed', '06:30', 'Boxing', 'Fight Fit', 'Arjun D.', 50, 7, 16, 'High'),
  c(9, 'Wed', '18:00', 'Yoga', 'Power Yoga', 'Leah P.', 60, 5, 18, 'Medium'),
  c(10, 'Wed', '20:00', 'Spin', 'Rhythm Ride', 'Tara K.', 45, 18, 24, 'Medium'),
  c(11, 'Thu', '07:00', 'HIIT', 'Full Body Burn', 'Kabir R.', 45, 11, 20, 'High'),
  c(12, 'Thu', '18:30', 'Boxing', 'Combo Lab', 'Arjun D.', 50, 3, 16, 'High'),
  c(13, 'Fri', '07:30', 'Yoga', 'Yin & Restore', 'Leah P.', 60, 10, 18, 'Low'),
  c(14, 'Fri', '18:00', 'Spin', 'Friday Night Lights', 'Tara K.', 45, 1, 24, 'High'),
  c(15, 'Fri', '19:00', 'HIIT', 'Weekend Warm-Up', 'Kabir R.', 30, 15, 20, 'Medium'),
  c(16, 'Sat', '09:00', 'Yoga', 'Slow Saturday', 'Meera S.', 75, 6, 18, 'Low'),
  c(17, 'Sat', '10:30', 'Boxing', 'Sparring Prep', 'Arjun D.', 60, 8, 16, 'High'),
  c(18, 'Sat', '11:30', 'HIIT', 'Partner Circuit', 'Kabir R.', 45, 0, 20, 'High'),
]

export const achievements = [
  { id: 'streak7', title: 'On Fire', desc: '7-day workout streak', icon: 'Flame', unlocked: true },
  { id: 'early', title: 'Early Bird', desc: '10 workouts before 7am', icon: 'Sunrise', unlocked: true },
  { id: 'pr10', title: 'Record Breaker', desc: 'Set 10 personal records', icon: 'Trophy', unlocked: true },
  { id: 'classes25', title: 'Class Act', desc: 'Attend 25 classes', icon: 'Calendar', unlocked: true },
  { id: 'ton', title: 'The Ton', desc: 'Deadlift 100 kg', icon: 'Dumbbell', unlocked: true },
  { id: 'hours100', title: 'Century', desc: 'Train for 100 hours', icon: 'Timer', unlocked: true },
  { id: 'streak30', title: 'Unstoppable', desc: '30-day workout streak', icon: 'Zap', unlocked: false, progress: 12, target: 30 },
  { id: 'bw-bench', title: 'Bodyweight Bench', desc: 'Bench your bodyweight', icon: 'Medal', unlocked: false, progress: 67.5, target: 72 },
  { id: 'marathon', title: 'Cardio King', desc: 'Burn 50,000 kcal', icon: 'HeartPulse', unlocked: false, progress: 38200, target: 50000 },
]
