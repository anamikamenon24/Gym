# PulseFit — Test Report

**Date:** 16 October 2026  
**Result:** ✅ All automated tests pass · production build has zero errors and zero warnings

Run everything with one command:

```bash
npm run test:all
```

| Suite | Command | Total | Passed | Failed | Skipped |
|---|---|---:|---:|---:|---:|
| Backend API + logic (Vitest + Supertest) | `npm run test` | 92 | 92 | 0 | 0 |
| Browser end-to-end (Playwright, desktop Chrome + iPhone 13 size) | `npm run test:e2e` | 68 | 65 | 0 | 3 |
| **Total** | `npm run test:all` | **160** | **157** | **0** | **3** |

The 3 skipped tests are the physical-keyboard checks. They run on desktop and are skipped on the phone-size screen on purpose, because phones don't have a Tab key.

---

## How the tests protect your real data

- **Backend tests:** each test file starts its own **in-memory Postgres** with the real schema and sample data, and throws it away afterwards. Test users get `@pulsefit.test` emails and are deleted at the end of each file.
- **Browser tests and Lighthouse:** they start their **own copy of the app on separate ports** (4173 and 3101, plus 4174 and 3102 for Lighthouse), also with a throwaway in-memory database.
- **What's never touched:** your `.data/pglite` database, the `test@pulsefit.com` account, and any Neon database. All tests force `DATABASE_URL` off.
- **Production build:** the browser tests run against the real production build (`vite build` + `vite preview`), not the dev server.

---

## What is covered

### Backend (`tests/api`, `tests/unit`)
- **Sign up:**
  - works and sets an httpOnly, SameSite=Lax cookie (marked Secure in production);
  - stores a bcrypt hash, never the password;
  - blocks duplicate emails, including different capitalisation;
  - rejects empty, short or whitespace-only passwords, a missing name, a bad email, and goals out of range.
- **Login:**
  - works, and ignores stray spaces;
  - a wrong password and an unknown email both get the same error, so nobody can find out which emails are registered;
  - logout clears both cookies.
- **`/api/auth/me`:** returns the user with their streak; returns 401 when logged out, for a forged cookie, and for a deleted user.
- **`/api/stats`:** members, workouts completed and classes this week are all real numbers, and they go up correctly.
- **`/api/exercises`:** returns all 30 with the correct fields; each of the 6 muscle-group filters returns exactly 5. An injection attempt in the filter is ignored safely.
- **`/api/workouts` and `/api/sets`:**
  - the full flow: create today's workout → add exercises → start on first tick → tick and untick → complete;
  - duplicate exercises are blocked; invalid IDs get 400 or 404;
  - restarting a workout clears its sets; finishing twice keeps the original duration;
  - a finished workout is locked; each day gets its own workout; an invalid date falls back safely.
- **Security:**
  - all protected routes return 401 without a login;
  - user B cannot see, tick, complete, reset or add to user A's workout, even if they send A's IDs;
  - cookies signed with a different secret are rejected;
  - the readable "hint" cookie alone grants no access.
- **Streak (with fake dates):**
  - no workouts → 0; 3 days in a row → 3; a missed day resets it;
  - today plus yesterday → 2; yesterday's streak stays alive during today;
  - unfinished workouts are ignored; streaks carry across a month boundary.
- **Weekly chart and rings:**
  - exactly 7 days, oldest first, with minutes on the right days;
  - the week runs Monday to today, so last week and future workouts are excluded;
  - goals hit is calculated correctly; a new user gets zeros, never NaN;
  - going over a goal works; Monday and Sunday edge cases work.
- **Ring maths (unit tests):** never above 100%, never below 0%, and never NaN, even with a zero, null, NaN or Infinity goal.

### Browser (`tests/e2e`), run on desktop Chrome and on an iPhone 13-size screen
- **Landing:**
  - "PulseFit" appears in the tab title, navbar, hero and footer;
  - the favicon loads;
  - the counters animate up to the real `/api/stats` numbers;
  - "Start Your Workout" goes to sign up when logged out and to the Dashboard when logged in;
  - the navbar shows the name and a logout button.
- **Full journey:**
  - sign up → land on the Dashboard;
  - the Library's muscle-group filters each show exactly that group's 5 cards;
  - add 2 exercises → the Dashboard shows the workout → Start;
  - the rest timer counts down (and never shows more than the rest time);
  - tick every set, one of them using the keyboard → finish → the confetti appears;
  - the Dashboard shows the streak, the rings (1/4) and the chart ("1 active day");
  - after a refresh, everything is still there;
  - logout → the Dashboard, Library, Live Workout and Profile pages all redirect to Login;
  - logging back in returns you to the page you were trying to open.
- **Quality, on every page:**
  - no browser console errors or warnings;
  - no horizontal scrolling at 375px;
  - no WCAG 2 A/AA violations from the axe accessibility checker, in **dark and light mode**;
  - every button and link has text or a label; every image has alt text.
- **Keyboard:**
  - Tab reaches "Start Your Workout" and Enter opens it;
  - the login form works with the keyboard only;
  - the sidebar links can be focused and opened with the keyboard.
- **Friendly errors and empty states:**
  - a wrong password shows a friendly message;
  - when the API is down, the Dashboard shows an error with a "Try again" button instead of crashing;
  - "No workout yet today" appears on the Dashboard and Live Workout;
  - a Library search with no results shows an empty state.

---

## Bugs found and fixed

| # | Bug | How it was found | Fix |
|---|---|---|---|
| 1 | `/api/auth/me` answered **200** for logged-out visitors, forged cookies and deleted users (the spec asks for 401) | Backend tests (5 failures) | Now returns **401** and clears stale cookies. A second, readable `pf_hint` cookie (it holds no secret) lets the page skip the check for logged-out visitors, so they don't get a 401 error in the console |
| 2 | **Rest timer showed 0:46 for a 45-second rest** for a moment | Browser test | The clock refreshes every 200ms and could lag behind the moment the rest started. The display is now capped at the rest length |
| 3 | **Logging out from a members-only page went to Login instead of the home page** (seen on the phone-size screen) | Browser test | Logging out cleared the user while still on the protected page, which redirected to Login first. Now it goes home first, then logs out. The sidebar and header share one `useLogout` |
| 4 | **Faint small text in light mode:** green accent text (about 3.9:1), orange "spots left", red "Sign out" | axe checks in light mode | Deeper shades of the same colours **in light mode only** (green `#3D6E08`, orange `#C2410C`, red `#BE123C`, amber `#B45309`). Dark mode is unchanged |
| 5 | Classes day buttons: the "classes" label was too faint (faded to 70% on top of grey text) | axe check | Removed the extra fade |
| 6 | No `<main>` landmark on the Landing, Login, Sign-up and 404 pages | Lighthouse | Added it, with no visual change |
| 7 | Show-password eye button was too small to tap easily | Lighthouse ("target size") | Bigger tap area (32px), same icon and position |
| 8 | Profile link's accessible name didn't match its visible initials; the user's name wasn't announced on phones | Lighthouse and a browser test | The name is now announced on every screen size; phones still show only the initials, as before |
| 9 | Library search box had no label for screen readers | Code review | Added `aria-label="Search exercises"` |
| 10 | `robots.txt` was missing, so the server returned the app's HTML page in its place (SEO 91) | Lighthouse | Added `public/robots.txt` (lets search engines index the site, keeps `/api` out) |
| 11 | Every page downloaded the charts library (about 110 KB unused on the landing page) and the confetti code | Lighthouse | Pages now load on demand; the charts library loads only with the Dashboard and Progress pages, and the confetti only with Live Workout |
| 12 | The Google Fonts stylesheet blocked the first paint | Lighthouse | Fonts now load without blocking (same fonts, same look once loaded) |
| 13 | **Refreshing or opening a deep link (e.g. `/dashboard`) would show a 404 on Vercel** | Deployment review (local servers don't have this problem) | Added `vercel.json` to send every non-`/api` address to the app |
| 14 | "1 active **days**" on the Dashboard | Browser test | Now says "1 active day" or "N active days" |
| 15 | Progress rings could show NaN or go over 100% with unusual data | Reviewed while writing tests | One shared, tested `ratio`/`percent` helper is used by every ring and "% of goal" label |
| 16 | React Router "future flag" console warnings | Preventive | Opted in to the v7 behaviour flags |

These were mistakes in my first draft of the tests, not app bugs: a duplicate "Start Your Workout" link (there are two on purpose), two toasts on screen at once, text matching inside a toast, and expecting the Dashboard after login when the app correctly returns you to the page you were on.

---

## Lighthouse scores

These are measured on the **production build**. Mobile is Lighthouse's default: a simulated slow phone with slow 4G and a CPU slowed down 4×. The Dashboard was audited while logged in. Run `npm run lighthouse` (add `-- --desktop` for desktop scores).

### Mobile: before → after

| Page | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| Landing | 85 → **88** | 98 → **100** | 100 → **100** | 91 → **100** |
| Login | 88 → **90–92** | 93 → **100** | 100 → **100** | 91 → **100** |
| Dashboard | 89 → **92–95** | 100 → **100** | 100 → **100** | 91 → **100** |

### Desktop (after)

| Page | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| Landing | **96** | 100 | 100 | 100 |
| Login | **99** | 100 | 100 | 100 |
| Dashboard | **100** | 100 | 100 | 100 |

Performance varies by about ±3 between runs; the ranges show the runs I did.

**One score is still below 90: Landing performance on mobile (88).** The largest piece of content is the hero headline. It deliberately fades in from invisible, so on a slow phone it can't count as "painted" until the JavaScript has loaded and the animation starts. Getting past 90 would mean dropping the headline's fade-in, which changes the design, so I left it. If you're happy for the headline to appear instantly (it would still slide up), that one change should push it past 90.

---

## Please check these by hand

1. **Light-mode colours:** some small text in light mode (green badges, orange "spots left", red "Sign out") is now a slightly darker shade so it's readable. Have a quick look in light mode to make sure you're happy with it.
2. **Real iPhone (Safari):** the phone tests use Chromium at iPhone size, not Safari. Open the app on a real phone before launch.
3. **Neon:** every test used the local database. After deploying with Neon:
   - run `npm run db:setup` against Neon (put the Neon `DATABASE_URL` in `.env`, run it, then remove it again if you want to stay local);
   - do one quick sign-up → add exercise → finish workout run on the live site.
4. **You'll be logged out once:** existing browser sessions don't have the new `pf_hint` cookie, so log in again once (test@pulsefit.com / Test1234!).
5. **"Rest over" pop-up and vibration:** the test checks the timer counting down, but not the full 30–45 seconds to the end. Let one rest finish on your phone.
6. **Screen reader:** the automated checks pass, but a quick listen with VoiceOver or NVDA is still worth doing.
7. **Still on mock data, as planned:** Classes, Progress and the Profile badges/XP. Class bookings are not saved yet.

---

## Round 2 — screen-by-screen check (22 October 2026)

New file `tests/e2e/screens.spec.js` adds checks for:
- **Screens:** Progress (line chart, trophy badges), Class Booking (spots go down, toast, full classes can't be booked), Profile (avatar, level, badges), the Dashboard rings filling and the chart bars, and the rest timer draining its circle;
- **Branding:** the gradient logo and the favicon;
- **Screen sizes:** 375 / 768 / 1440 px (bottom bar vs sidebar, no sideways scroll, tap targets at least 32px);
- **Theme toggle:** works on every screen, with a contrast check in both themes;
- **Extras:** quote of the day, every link and nav item, and that no button is dead.

New script: `npm run test:e2e:dev` runs the whole browser suite against the **dev server** too, so React's development-only warnings also count as failures.

| Run | Passed | Failed | Skipped |
|---|---:|---:|---:|
| `npm run test` (backend) | 92 | 0 | 0 |
| `npm run test:e2e` (production build) | 96 | 0 | 8 |
| `npm run test:e2e:dev` (dev server) | 96 | 0 | 8 |

Skipped = desktop-only checks (keyboard, and the fixed-size screen and theme sweeps) on the phone browser, which would only repeat the same work.

Bugs fixed in this round:
1. **Footer:** 12 links went nowhere (`href="#"`: Pricing, About, Careers…). They now point to real screens: Workout Library, Live Workout, Progress, Features, Classes, Dashboard, Sign up, Log in, Profile.
2. **Profile "Sign out":** it still showed "This is a demo, no account backend" and didn't log out. It now logs out properly.
3. **Profile "Workout reminders":** it said "Reminders on" but did nothing. It now honestly says "Coming soon".
4. **Tiny tap targets on phones:** the toast close ✕ (16px), the workout-complete ✕ (20px) and the search clear ✕ (16px) now have 32–40px tap areas. The icons look the same.
5. **Phone bottom bar:** the "Train" label became unreadable when bright content scrolled under the see-through bar. The bar is now 92% solid; it's still glass.

## New files

- `vitest.config.js`, `tests/api/*.test.js`, `tests/unit/progress.test.js`: backend and logic tests
- `playwright.config.js`, `tests/e2e/*.spec.js`: browser tests
- `scripts/lighthouse.mjs`: the Lighthouse audit (`npm run lighthouse`)
- `server/app.js`: the shared Express app used by the dev server and the tests
- `vercel.json`: makes deep links work on Vercel
- `public/robots.txt`
- `src/lib/progress.js`: safe ring maths
