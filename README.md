# Insphere - Competitive Programming Platform

A gamified social platform for tracking competitive programming progress across LeetCode, GeeksforGeeks, Codeforces, and GitHub. Built with Next.js 16, Supabase, and featuring a dark modern gaming aesthetic.

## Features

### Profile Tracking Dashboard
- **Multi-Platform Support**: Track stats from LeetCode, GeeksforGeeks, Codeforces, and GitHub in one place
- **Profile Analytics**: View your coding statistics, progress, and achievements
- **Real-time Syncing**: Connect your usernames to pull live data from platforms

### Gamification System
- **Points & Levels**: Earn points by solving problems and reaching milestones
- **Badges & Achievements**: Unlock special badges for achievements like "Century Club", "Problem Slayer", and "Streak Master"
- **Leaderboards**: Compete globally and see where you rank among other competitive programmers

### Community & Social
- **Friend System**: Send and accept friend requests to build your network
- **Direct Messaging**: Real-time chat with friends with unread indicators and toast notifications
- **Private Communities**: Create invite-only groups with access codes
- **Discover Users**: Find and follow other competitive programmers
- **Community Posts**: Share tips, achievements, and discuss strategies

### Direct Messaging
- **Real-time Chat**: Instant message delivery with Supabase Realtime
- **Friend-only Access**: Secure messaging only between connected friends
- **Rich Notifications**: Toast popups for new messages and dashboard badges
- **Unread Indicators**: Visual glowing dot indicators for unread conversations

### Progress Analytics
- **Monthly Charts**: Visualize your problem-solving progress over time
- **Platform Statistics**: Detailed stats for each coding platform
- **Streak Tracking**: Maintain and track daily coding streaks
- **Insights**: Get personalized recommendations based on your performance

## Tech Stack

- **Frontend**: Next.js 16, React, TypeScript
- **Styling**: Tailwind CSS, Shadcn/UI components
- **Backend**: Supabase (PostgreSQL + Auth)
- **Authentication**: Supabase Auth with email/password
- **Icons**: Lucide React
- **Fonts**: Inter (body), JetBrains Mono (code)

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase project (free tier available)

### Installation

1. **Clone and setup**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   Add these to your `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. **Run migrations** (if needed)
   Execute the SQL scripts in `/scripts` folder against your Supabase database:
   - `001_initial_schema.sql` - Core tables (profiles, coding_stats, badges)
   - `002_rls_policies.sql` - Row Level Security policies
   - `003_seed_badges.sql` - Initial badge data
   - `012_follow_system.sql` - Follow/Unfollow logic
   - `013_fix_community_policies.sql` - Admin rights fixes
   - `014_friend_system.sql` - Friend requests table and policies
   - `015_fix_friend_references.sql` - FK fixes for friends
   - `016_reset_unread_messages.sql` - Unread message state reset

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   Navigate to `http://localhost:3000`

## Project Structure

```
app/
├── page.tsx                 # Landing page
├── dashboard/              # Main dashboard
├── community/              # Community posts & discussions
├── messages/               # Direct messaging
├── leaderboard/            # Global leaderboard
├── badges/                 # Badge showcase
├── analytics/              # Progress visualization
├── profile/                # Profile settings
├── users/                  # User discovery
└── auth/                   # Authentication pages
    ├── login/
    ├── sign-up/
    └── error/

components/
├── dashboard/              # Dashboard-specific components
│   ├── profile-card.tsx
│   ├── coding-stats.tsx
│   └── badges-showcase.tsx

lib/
├── supabase/               # Supabase client setup
│   ├── client.ts
│   ├── server.ts
│   └── proxy.ts

scripts/
├── 001_tables.sql         # Table creation
├── 002_rls_policies.sql   # Security policies
└── 003_seed_badges.sql    # Initial data
```

## Key Pages

### Authentication
- `/auth/login` - Sign in to existing account
- `/auth/sign-up` - Create new account
- `/auth/sign-up-success` - Confirmation page

### User Facing
- `/dashboard` - Main dashboard with profile and stats
- `/community` - Browse and post in community
- `/messages` - Direct messaging with users
- `/leaderboard` - Global rankings
- `/badges` - Achievement showcase
- `/analytics` - Progress charts and insights
- `/profile` - Edit profile and connect platforms
- `/users` - Discover and follow users

## Database Schema

### Core Tables
- **profiles** - User profile information and stats
- **coding_stats** - Per-platform problem solving stats
- **badges** - Available badges definition
- **user_badges** - Badge ownership (earned badges)
- **leaderboard** - Rankings and scores

### Social Features
- **follows** - User follow relationships
- **messages** - Direct messages between users
- **community_posts** - Community discussion posts
- **post_comments** - Comments on posts
- **post_likes** - Post engagement tracking

## Authentication Flow

1. Users sign up with email/password
2. Supabase creates auth user and triggers profile creation via trigger
3. User confirms email
4. Profile auto-created with user metadata
5. User logs in and accesses protected routes
6. Middleware validates session

## Row Level Security (RLS)

All tables have RLS enabled with policies allowing:
- Users to read public data
- Users to modify only their own data
- Proper isolation between user data

## Design System

### Colors
- **Primary**: Purple (#a855f7) / Pink (#ec4899)
- **Secondary**: Blue (#0ea5e9)
- **Accent**: Yellow (#facc15) / Orange (#f97316)
- **Background**: Slate-950 (#030712)
- **Surface**: Slate-800 (#1e293b)

### Typography
- **Headings**: Inter Bold
- **Body**: Inter Regular
- **Mono**: JetBrains Mono

## Future Enhancements

- Real API integrations for live platform stats
- Discord bot for notifications
- Mobile app (React Native)
- Advanced analytics with ML insights
- Scheduled contests within platform
- Problem recommendation engine
- Study groups and team features

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repo to Vercel
3. Add environment variables
4. Deploy

### Self-hosted
- Use Node.js adapter
- Ensure Supabase connectivity
- Set environment variables

## Contributing

This is a starter template. Feel free to extend with:
- Real platform API integrations
- Additional features
- UI improvements
- Performance optimizations

## License

MIT License - Built for the competitive programming community

## Support

For issues or questions, check the Supabase documentation and Next.js docs for integration help.

---

**Built with love for competitive programmers** 🎮
