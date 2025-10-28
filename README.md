# DMA Platform

A modern B2B2C e-learning platform built with Next.js, TypeScript, Firebase, and Tailwind CSS.

## Features

- 🚀 Next.js 14 with App Router
- 💎 TypeScript for type safety
- 🔥 Firebase Backend (Auth, Firestore, Storage, Functions)
- 🎨 Tailwind CSS for styling
- 📦 Shadcn/UI components
- 🌙 Dark mode support
- 📱 Responsive design
- 🔒 Firebase Authentication
- 🎯 SEO optimized
- 📚 Course Management System
- 👥 User Management
- 💳 Payment Integration

## Architecture

- **Frontend:** Next.js 14 with App Router
- **Backend:** Firebase Cloud Functions
- **Database:** Firestore
- **Authentication:** Firebase Auth
- **File Storage:** Firebase Storage
- **Hosting:** Firebase Hosting

## Getting Started

### Prerequisites

1. **Firebase Project Setup:**
   - Create a Firebase project
   - Enable Authentication, Firestore, Storage, and Functions
   - Download service account key

2. **Environment Variables:**
   ```bash
   # Copy the example environment file
   cp .env.example .env.local
   ```

3. **Firebase Configuration:**
   - Add your Firebase config to `src/firebase.js`
   - Set up Firestore security rules
   - Configure Firebase Functions

### Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/elira.git
   cd elira
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Start Firebase emulators:**
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)** with your browser to see the result.

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── (admin)/           # Admin routes
│   ├── (auth)/            # Authentication routes
│   └── courses/           # Course-related routes
├── components/             # React components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
├── stores/                # State management
└── types/                 # TypeScript definitions

functions/                 # Firebase Cloud Functions
├── src/                   # Function source code
└── lib/                   # Function utilities

docs/                      # Documentation
├── migration-reports/     # Migration documentation
└── priority-roadmap.md    # Development roadmap
```

## Deployment

### Firebase Deployment

1. **Deploy Functions:**
   ```bash
   firebase deploy --only functions
   ```

2. **Deploy Hosting:**
   ```bash
   firebase deploy --only hosting
   ```

3. **Deploy All:**
   ```bash
   firebase deploy
   ```

### Environment Setup

1. **Set Firebase Functions Config:**
   ```bash
   firebase functions:config:set stripe.secret_key="your_stripe_secret"
   ```

2. **Set Environment Variables:**
   ```bash
   firebase functions:config:set app.environment="production"
   ```

## Documentation

- [Migration Summary](docs/migration-reports/MIGRATION_SUMMARY.md) - Complete migration documentation
- [Priority Roadmap](docs/priority-roadmap.md) - Development roadmap and tasks
- [Firebase Setup](docs/migration-reports/FIREBASE_CONFIGURATION_FIX.md) - Firebase configuration guide

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 