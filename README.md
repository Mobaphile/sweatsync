# SweatSync 💪

A personal workout tracking web app that actually focuses on what matters: consistent tracking and meaningful progress insights. No BS, no bloat.

## 🎯 Vision

SweatSync was born from a simple need: I wanted a straightforward way to track workouts without the bloat of commercial fitness apps. Something that:
- Works seamlessly on my phone during workouts
- Tracks progressive overload (the key to actual strength gains)
- Handles both rep-based and time-based exercises
- Lets me upload custom workout plans from JSON (because who doesn't love having an AI design their workout?)
- Shows my consistency streaks and keeps me accountable

This isn't about social features or competing with strangers on the internet. It's about you and getting stronger.

## 🚀 Features

### Currently Working
- ✅ User authentication (secure login for you and your partner)
- ✅ Daily workout tracking with sets, reps, and weights
- ✅ Basic workout history
- ✅ Mobile-responsive design
- ✅ Exercise notes for form cues or personal reminders

### Coming Soon
See my [roadmap](#-roadmap) below for what's next!

## 🛠️ Tech Stack

- **Backend**: Node.js + Express (keeping it simple and fast)
- **Database**: SQLite (perfect for personal use, no overkill)
- **Frontend**: React + Vite + Tailwind CSS (modern and responsive)
- **Auth**: JWT tokens (secure and stateless)

## 📦 Installation

### Prerequisites
- Node.js 16+ installed
- Basic knowledge of running commands in terminal

### Backend Setup
```bash
# Clone the repo
git clone https://github.com/yourusername/sweatsync.git
cd sweatsync

# Install backend dependencies
npm install

# Start the backend server
npm run dev
```

### Frontend Setup
```bash
# In a new terminal, navigate to frontend
cd frontend

# Install frontend dependencies
npm install

# Start the frontend dev server
npm run dev
```

### Access the App
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## 📁 Project Structure
```
sweatsync/
├── server.js                 # Express server entry point
├── server/                   # Backend code
│   ├── routes/              # API endpoints
│   ├── models/              # Database models
│   └── middleware/          # Auth middleware
├── workout-plans/           # JSON workout plans
├── workout_tracker.db       # SQLite database
└── frontend/                # React app
    └── src/
        ├── App.jsx          # Main component
        └── components/      # Reusable components
```

## 🗺️ Roadmap

### Phase 1: Core Improvements (Current Focus)
**Goal**: Fix the annoying stuff and make daily use smoother

- [x] **Fix time-based exercises** - Handle exercises measured in seconds (planks, wall sits, etc.)
- [x] **Delete workouts** - Add ability to remove workouts from history
- [x] **Upload JSON** - Add ability to upload a JSON workout
- [ ] **Enhanced history page** - Show date/time and make workouts clickable for detailed view
- [ ] **Detailed workout view** - Click any past workout to see all sets, weights, and notes
- [ ] **Better error handling** - Clear messages when things go wrong

### Phase 2: Production Deployment
**Goal**: Get this thing online and learn some DevOps

- [ ] **Domain setup** - Deploy to your personal domain
- [ ] **Basic CI/CD pipeline** - Auto-deploy when pushing to main
- [ ] **Environment configuration** - Separate dev/prod settings
- [ ] **Database backups** - Don't lose your gains!
- [ ] **HTTPS setup** - Keep those workout stats secure

### Phase 3: Progress Tracking & Analytics
**Goal**: See your gains and stay motivated

- [ ] **Progressive overload tracking** - Visualize weight/rep increases per exercise
- [ ] **Consistency streaks** - How many days in a row? How many this month?
- [ ] **Exercise-specific analytics** - Drill down into individual exercise progress
- [ ] **Personal records** - Track and celebrate PRs
- [ ] **Simple dashboard** - At-a-glance view of your progress

### Phase 4: Goal Setting & Tracking
**Goal**: Set targets and crush them

- [ ] **Goal creation** - Set strength, consistency, or volume goals
- [ ] **Progress indicators** - Visual feedback on goal progress
- [ ] **Goal completion celebrations** - Make achieving goals feel awesome
- [ ] **Smart goal suggestions** - Based on your current performance

### Phase 5: Enhanced Workout Management
**Goal**: Make workout planning more flexible

- [ ] **Multiple workout plans** - Store and switch between different programs
- [ ] **Plan browser** - View all your plans and set one as active
- [ ] **Basic plan editor UI** - Create/edit plans without touching JSON
- [ ] **Plan templates** - Start from common workout splits

### Phase 6: PWA & Polish
**Goal**: Make it feel like a real app

- [ ] **Progressive Web App** - Installable on phones
- [ ] **Offline support** - Track workouts without internet
- [ ] **Smooth animations** - Little touches that make it feel premium
- [ ] **Dark mode** - Because who doesn't want dark mode?

### Future Ideas (Maybe Someday)
- Export data (PDF reports, CSV dumps)
- Exercise instruction videos/images
- Rest timer with notifications
- Warm-up/cooldown tracking
- Workout plan marketplace (share plans with others)

## 🤝 Contributing

This is a personal project, but if you want to use it and have ideas, feel free to:
1. Fork it
2. Create a feature branch
3. Submit a PR with your improvements

Just keep in mind the vision: simple, focused, and couple-friendly.

## 📝 License

MIT - Do whatever you want with it!

## 🙏 Acknowledgments

- My wife, for being my workout partner and beta tester
- The React and Node.js communities for excellent documentation
- ChatGPT/Claude for helping debug the tricky bits

---

**Remember**: The best workout app is the one you actually use. Keep it simple, track consistently, and trust the process. 💪