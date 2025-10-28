# Aware Setup Guide

Complete step-by-step instructions to get Aware running locally and in production.

## Part 1: Database Setup (Required)

### Step 1: Access Supabase SQL Editor

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: `porlpqidmcuoxvjnwhcm`
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run Database Schema

1. Open the file `DATABASE_SCHEMA.sql` in this project
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter / Cmd+Enter)

You should see a success message like:
```
Success. No rows returned
```

### Step 3: Verify Tables Created

1. In Supabase dashboard, click **Table Editor**
2. You should see these tables:
   - profiles
   - subscriptions
   - courses
   - assignments
   - scans
   - insights
   - audit_log

### Step 4: Test Auth Trigger

The database automatically creates a profile when a user signs up. To verify:

1. Create a test user via the app (sign up)
2. In Supabase dashboard, go to **Authentication** → **Users**
3. Find your test user
4. Go to **Table Editor** → **profiles**
5. Verify a profile row exists with the same ID

## Part 2: Local Development

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Verify Environment Variables

Check that `.env` exists and contains:

```env
VITE_SUPABASE_URL=https://porlpqidmcuoxvjnwhcm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

These are already configured for your project.

### Step 3: Start Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Step 4: Test Core Functionality

1. **Sign Up**: Create a new account
2. **Create Course**: Add a course with weighted categories
3. **Add Assignment**: Add a few assignments to the course
4. **Check Grade**: Verify the grade calculates correctly
5. **What-If**: Test the what-if calculator

## Part 3: Production Deployment

### Option A: Deploy to Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Set environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Option B: Deploy to Netlify

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Build:
   ```bash
   npm run build
   ```

3. Deploy:
   ```bash
   netlify deploy --prod --dir=dist
   ```

4. Set environment variables in Netlify dashboard

### Option C: Manual Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Upload the `dist/` folder to any static hosting service:
   - AWS S3 + CloudFront
   - GitHub Pages
   - Cloudflare Pages
   - Azure Static Web Apps

3. Configure environment variables in your hosting platform

## Part 4: Adding AI Scanning (Future)

When you're ready to implement AI scanning:

### Step 1: Get API Keys

1. **OpenAI API Key**:
   - Sign up at [https://platform.openai.com](https://platform.openai.com)
   - Go to API Keys
   - Create new key
   - Save as `OPENAI_API_KEY`

2. **Stripe Keys** (for payments):
   - Sign up at [https://stripe.com](https://stripe.com)
   - Get test keys from dashboard
   - Save as `STRIPE_SECRET_KEY` and `STRIPE_PUBLIC_KEY`

### Step 2: Create Supabase Edge Function

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Create function:
   ```bash
   supabase functions new process-scan
   ```

3. Add code to `supabase/functions/process-scan/index.ts`:
   ```typescript
   import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

   const corsHeaders = {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
   }

   serve(async (req) => {
     if (req.method === 'OPTIONS') {
       return new Response('ok', { headers: corsHeaders })
     }

     try {
       const { imageUrls } = await req.json()

       // TODO: Implement OCR + LLM parsing
       // Use Deno.env.get('OPENAI_API_KEY')

       return new Response(
         JSON.stringify({ success: true }),
         { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
       )
     } catch (error) {
       return new Response(
         JSON.stringify({ error: error.message }),
         { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
       )
     }
   })
   ```

4. Deploy function:
   ```bash
   supabase functions deploy process-scan
   ```

5. Set secrets:
   ```bash
   supabase secrets set OPENAI_API_KEY=your_key_here
   ```

### Step 3: Connect UI to Edge Function

Update the scan UI to call your Edge Function instead of mock data.

## Troubleshooting

### Database Connection Issues

**Problem**: Can't connect to Supabase
**Solution**:
- Verify `.env` file exists and has correct values
- Check Supabase project is active
- Verify network connection

### Authentication Issues

**Problem**: Sign up/login not working
**Solution**:
- Check Supabase Auth is enabled in project settings
- Verify email confirmation is disabled (or check email inbox)
- Clear browser cookies and try again

### Grade Calculation Issues

**Problem**: Grades showing as 0% or incorrect
**Solution**:
- Ensure assignments have status = "graded"
- Check category IDs match between course and assignments
- Verify earned/total points are numbers, not strings

### Build Errors

**Problem**: `npm run build` fails
**Solution**:
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check for TypeScript errors: `npm run typecheck`

### RLS Policy Issues

**Problem**: Can't read/write data after signup
**Solution**:
- Verify RLS policies were created (check Supabase dashboard)
- Check user is authenticated (look at Supabase Auth dashboard)
- Verify `auth.uid()` matches user ID in tables

## Testing Checklist

Before going live, test:

- [ ] User can sign up with email/password
- [ ] User can log in
- [ ] User can reset password (check email)
- [ ] User can create course (up to 3 for free tier)
- [ ] User can add assignments to course
- [ ] Grades calculate correctly (test with known values)
- [ ] What-If calculator works
- [ ] User can delete assignments
- [ ] User can delete courses
- [ ] User can sign out
- [ ] Different users see only their own data (test with 2 accounts)

## Performance Optimization

### Enable Postgres Indexes

Already created in schema, but verify:
```sql
-- Check indexes exist
SELECT * FROM pg_indexes WHERE tablename = 'assignments';
```

### Enable Supabase Caching

In Supabase dashboard:
1. Go to **Database** → **Extensions**
2. Enable `pg_stat_statements` for query performance monitoring

### Optimize Images (Future)

When adding scan functionality:
- Use Supabase Storage with image transformation
- Compress images before upload
- Use WebP format

## Monitoring

### Supabase Dashboard

Monitor in real-time:
- **Database**: Active connections, slow queries
- **Auth**: User signups, login attempts
- **Storage**: File uploads (for future scanning)
- **Logs**: Edge Function invocations (when implemented)

### Application Monitoring

Consider adding:
- Sentry for error tracking
- Google Analytics for usage stats
- LogRocket for session replay

## Security Best Practices

✅ **Already Implemented**:
- Row Level Security on all tables
- Supabase Auth for user management
- Environment variables for secrets

⚠️ **To Add Later**:
- Rate limiting on Edge Functions
- Input validation and sanitization
- CAPTCHA on signup (if spam becomes an issue)
- Content Security Policy headers

## Next Steps

1. **Test thoroughly** with real course data
2. **Gather feedback** from students using it
3. **Prioritize features** based on user needs
4. **Implement AI scanning** when ready (see Part 4)
5. **Add Stripe payments** to enable premium tier

---

**Questions?** Check the main README.md for more details.
