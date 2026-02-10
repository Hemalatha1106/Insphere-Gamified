# Features Update - Profile & Community Enhancements

This update introduces a comprehensive overhaul of the User Profile system, adds community leaderboards, and implements social following features.

## 🚀 Key Features

### 1. Advanced Profile Management
-   **User Navigation**: New top-right dropdown menu with Avatar, serving as the central hub for Profile, Settings, and Logout.
-   **Edit Profile Form**: A unified, reusable component (`EditProfileForm`) accessible via modal or dedicated page.
-   **New Fields**: Added support for:
    -   **LinkedIn Username**: Link your professional profile.
    -   **Profile Banner**: Customize your profile header with a cover image.
    -   **Avatar Upload**: Upload profile photos directly to Supabase Storage.
    -   **Banner Upload**: Upload banner images directly to Supabase Storage.

### 2. Social & Community
-   **Public Profiles**: View other users' profiles by clicking their names in the leaderboard.
    -   *Read-Only Mode*: Edit buttons are hidden when viewing others.
-   **Community Leaderboard**: A real-time leaderboard in the Community sidebar, ranking members by Insphere Points.
-   **Follow System**:
    -   **Follow/Unfollow**: Users can follow each other.
    -   **Live Counts**: `Followers` and `Following` stats update instantly.
    -   **Optimistic UI**: Immediate visual feedback on button clicks.

### 3. UI/UX Improvements
-   **Glassmorphism Design**: Redesigned `ProfileCard` with modern aesthetics.
-   **Consistent Navigation**: Added "Back to Dashboard" links on Community and Message pages.
-   **Mobile Responsiveness**: Optimized profile and navigation elements for smaller screens.

---

## 🛠️ Setup & Migrations

To ensure these features work correctly, you must run the following SQL scripts in your Supabase SQL Editor.

### 1. Database Schema Updates
Run these to add necessary columns:

```sql
-- Add LinkedIn support
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_username TEXT;

-- Add Banner support
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;
```

### 2. Storage Setup
Run this to create buckets for file uploads:

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true) ON CONFLICT (id) DO NOTHING;

-- Allow public access
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id IN ('avatars', 'banners') );
CREATE POLICY "User Uploads" ON storage.objects FOR INSERT WITH CHECK ( bucket_id IN ('avatars', 'banners') );
```

### 3. Follow System Triggers
Run this **crucial** script to enable auto-updating follower counts:

```sql
-- Function to update counts
CREATE OR REPLACE FUNCTION public.handle_follow_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = OLD.following_id;
    UPDATE public.profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition
DROP TRIGGER IF EXISTS on_follow_stats ON public.follows;
CREATE TRIGGER on_follow_stats
AFTER INSERT OR DELETE ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.handle_follow_stats();
```

---

## 📂 Key Files Modified

-   `components/dashboard/profile-card.tsx`: Main UI for profile display.
-   `components/profile/edit-profile-form.tsx`: Form logic for updates & uploads.
-   `components/community/community-leaderboard.tsx`: New leaderboard component.
-   `components/profile/follow-button.tsx`: New follow action component.
-   `app/profile/[id]/page.tsx`: New public profile view.
-   `app/community/[id]/page.tsx`: Integrated leaderboard sidebar.
