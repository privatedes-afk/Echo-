# Echo

Journaling/reflection app where you chat with an AI version of yourself, five years from now.

## Stack
- **Expo (React Native)** — the app itself
- **Supabase** — auth (email/password + Google), Postgres database, Edge Functions for AI calls
- **OpenAI API** — powers Future You's replies (called securely from Supabase Edge Functions, never from the app directly)
- **RevenueCat** — subscription/paywall handling

## Setup

1. **Install dependencies**
   ```
   npm install
   ```

2. **Create a Supabase project** at supabase.com (free tier), then:
   - Run `supabase/schema.sql` in the SQL editor to create all four tables + RLS policies
   - Enable Email and Google providers under Authentication > Providers
   - Deploy the two Edge Functions:
     ```
     supabase functions deploy chat
     supabase functions deploy summary
     supabase secrets set OPENAI_API_KEY=sk-...
     ```
   - Copy your project URL + anon key into `src/lib/supabase.js`

3. **Update AI backend URLs** in `src/lib/ai.js` to point at your deployed Edge Functions.

4. **Set up RevenueCat** (revenuecat.com, free until you have real revenue) and add your API key where `Purchases.configure` is called (add this in `App.js` on startup).

5. **Run it**
   ```
   npx expo start
   ```
   Scan the QR code with the Expo Go app on your phone — no app store needed to test.

## What's built (MVP scope)
- ✅ 10-step onboarding with progress bar, saved to `profiles` table
- ✅ Editable AI-generated summary screen after onboarding
- ✅ Chat screen with Future You, saved/reloaded history, typing indicator
- ✅ Time capsules: write, pick unlock date, countdown, local push notification, AI reflection on open
- ✅ Email/password + Google auth
- ✅ Free tier (5 msgs/day) vs paid tier (unlimited) with paywall screen

## Not yet built (by design, per MVP scope)
- ❌ Future-self video generation
- ❌ Server-side cron for guaranteed capsule push delivery when app is closed (notes left in `src/lib/notifications.js` for how to add this)
