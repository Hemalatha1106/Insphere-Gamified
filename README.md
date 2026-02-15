# Insphere - Gamified Competitive Programming Platform

A gamified social platform for tracking competitive programming progress across LeetCode, GeeksforGeeks, Codeforces, and GitHub. Built with Next.js 16, Supabase, and featuring a stark, modern dark-mode aesthetic.

## 🚀 Key Features

### 👤 Public Profiles & Portfolio
- **Unified Stats**: Aggregate your coding stats from LeetCode, GitHub, Codeforces, and GeeksforGeeks.
- **LeetCode Heatmap**: Visualize your coding activity with a rolling 365-day heatmap, downloadable as part of your profile card.
- **Shareable Card**: A dedicated public profile page (`/u/[username]`) to showcase your achievements.
- **PDF / Image Export**: Generate a professional, print-ready resume/CV or social media image from your profile with one click.
- **Customization**: Upload custom avatars and profile banners to personalize your space.

### 🤝 Social & Community
- **Friend System**: Search for users, send friend requests, and manage connections.
- **Follow System**: Follow users to track their progress and see their updates.
- **Leaderboards**: Compete globally or amongst friends with toggleable views and real-time point tracking.
- **Badges**: Earn unique badges for milestones (e.g., "Century Club", "Streak Master") and display them on your profile.
- **Levels & XP**: Gain XP for every problem solved and level up your profile.

### 💬 Real-time Communication
- **Instant Messaging**: Real-time 1-on-1 chat with friends.
- **Community Chat**: Participate in public channels and discussions.
- **Notifications**: Real-time alerts for friend requests, messages, and system updates.

### ⚙️ Account Management
- **Link Accounts**: Seamlessly link your LinkedIn, GitHub, LeetCode, and other coding profiles.
- **Delete Profile**: Secure "Danger Zone" to permanently delete your account and data.
- **Rate Limiting**: Intelligent throttling to prevent API spamming.

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **UI Components**: Shadcn/UI, Lucide Icons, Sonner (Toasts)
- **Utilities**: `react-to-print` (handling PDF generation via native print), `recharts` (analytics)

## 📦 Deployment

We have a dedicated guide for deploying this project to Vercel.

👉 **[Read the Deployment Guide (DEPLOY.md)](./DEPLOY.md)**

## 🏁 Getting Started Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/Hemalatha1106/insphere-gamified.git
   cd insphere-gamified
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000).

## 🗄️ Database Schema

The project uses Supabase (PostgreSQL). Key tables include:
- `profiles`: User data and stats.
- `coding_stats`: Platform-specific metrics.
- `messages`: Direct messages between users.
- `notifications`: Real-time alerts implementation.
- `friend_requests`: Handling connection logic.
- `badges` & `user_badges`: Gamification system.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
