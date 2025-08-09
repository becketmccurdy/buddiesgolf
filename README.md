# Buddies Golf 🏌️

A lightweight, clean web app for tracking casual golf rounds with friends. Built with React, TypeScript, TailwindCSS, and Firebase.

## Features

- **Authentication**: Sign in with Google or phone number
- **Dashboard**: View recent rounds, leaderboard, and quick stats
- **New Round**: Interactive scorecard with per-hole scoring
- **Round History**: Filter and view past rounds with detailed scorecards
- **Profile Management**: Edit profile info and view personal statistics
- **Responsive Design**: Works great on desktop and mobile

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: TailwindCSS
- **Authentication**: Firebase Auth (Google & Phone)
- **Database**: Firebase Firestore
- **Hosting**: Vercel (recommended)

## Quick Start

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Firebase project

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd buddiesgolf
npm install
```

### 2. Firebase Setup

1. Create a new Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Authentication with Google and Phone providers
3. Create a Firestore database
4. Get your Firebase config from Project Settings

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### 4. Firestore Security Rules

Set up these security rules in your Firestore database:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read all rounds and create new ones
    match /rounds/{roundId} {
      allow read, create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        request.auth.uid in resource.data.players;
    }
  }
}
```

### 5. Run the App

```bash
npm start
```

Visit `http://localhost:3000` to see your app!

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── LoadingSpinner.tsx
│   ├── Navigation.tsx
│   └── ScoreInput.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx
├── pages/              # Main page components
│   ├── Dashboard.tsx
│   ├── LoginPage.tsx
│   ├── NewRound.tsx
│   ├── Profile.tsx
│   └── RoundHistory.tsx
├── utils/              # Utility functions
│   └── firebase.ts
├── App.tsx             # Main app component
├── index.tsx           # App entry point
└── index.css           # Global styles
```

## Database Schema

### Users Collection
```typescript
{
  uid: string;
  name: string;
  photoURL?: string;
  homeCourse?: string;
  handicap?: number;
  stats: {
    wins: number;
    birdies: number;
    bestScore: number;
    averageScore: number;
    roundsPlayed: number;
  };
}
```

### Rounds Collection
```typescript
{
  id?: string;
  course: string;
  date: string;
  location?: { lat: number; lng: number };
  players: string[];
  scores: {
    uid: string;
    holes: number[];
  }[];
  winner?: string;
  createdAt: Date;
}
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Firebase Hosting

```bash
npm run build
firebase deploy
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for your own golf group!

## Support

If you run into any issues or have questions, please open an issue on GitHub.

---

Happy golfing! 🏌️⛳
