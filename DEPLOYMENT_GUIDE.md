# Aware - Complete Deployment Guide

This guide will help you deploy Aware with all features enabled, including AI scanning, insights, and Stripe payments.

## Quick Start (5 Minutes)

### 1. Database Setup

```bash
# Go to https://supabase.com/dashboard
# Select your project
# Open SQL Editor
# Run DATABASE_SCHEMA.sql

# Create storage bucket for scan images
```

In Supabase Dashboard → Storage → Create Bucket:
- Name: `scans`
- Public: Yes (for image uploads)

### 2. Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_ID

# Deploy all functions
supabase functions deploy process-scan
supabase functions deploy generate-insights
supabase functions deploy stripe-webhook
```

### 3. Set Environment Secrets

```bash
# OpenAI for AI features
supabase secrets set OPENAI_API_KEY=sk-...

# Stripe for payments
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...

# Optional: Add your Stripe public key to .env
echo "VITE_STRIPE_PUBLIC_KEY=pk_test_..." >> .env
```

### 4. Deploy Frontend

```bash
# Build the project
npm run build

# Deploy to Vercel (recommended)
vercel --prod

# Or Netlify
netlify deploy --prod --dir=dist
```

## Detailed Setup

### Database Configuration

#### 1. Run Initial Schema

Copy and run `DATABASE_SCHEMA.sql` in Supabase SQL Editor. This creates:
- All tables (profiles, courses, assignments, scans, etc.)
- Row Level Security policies
- Automated triggers
- Indexes for performance

#### 2. Create Storage Bucket

1. Go to Storage in Supabase Dashboard
2. Click "Create Bucket"
3. Name: `scans`
4. Public: ✅ Yes
5. File size limit: 10MB
6. Allowed MIME types: `image/*`

#### 3. Set up Storage Policies

```sql
-- Allow authenticated users to upload their own scans
CREATE POLICY "Users can upload scans"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'scans' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to read their own scans
CREATE POLICY "Users can read own scans"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'scans' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Edge Functions Setup

All Edge Functions are in `supabase/functions/` directory.

#### Deploy Process-Scan Function

```bash
cd supabase/functions/process-scan
supabase functions deploy process-scan --no-verify-jwt
```

**What it does:**
- Accepts multiple image URLs and OCR text
- Uses OpenAI GPT-4 Vision to parse syllabus and gradebook
- Merges results with conflict detection
- Returns preview JSON for user confirmation

**Mock Mode:** Automatically activates when OPENAI_API_KEY is not set, using deterministic fixtures for testing.

#### Deploy Generate-Insights Function

```bash
supabase functions deploy generate-insights
```

**What it does:**
- Calculates grade predictions using momentum algorithm
- Calls OpenAI for personalized suggestions
- Stores insights in database
- Returns formatted insights for UI display

#### Deploy Stripe Webhook

```bash
supabase functions deploy stripe-webhook --no-verify-jwt
```

**What it does:**
- Handles Stripe checkout completion
- Updates subscription status in database
- Manages subscription lifecycle (updates, cancellations)
- Handles payment failures

### Stripe Configuration

#### 1. Create Stripe Account

1. Sign up at https://stripe.com
2. Go to Developers → API Keys
3. Copy test keys (for development)

#### 2. Create Products

In Stripe Dashboard:

**Premium Plan:**
- Name: "Aware Premium"
- Price: $9.99/month
- Recurring: Monthly
- Copy Price ID (starts with `price_`)

#### 3. Set up Webhook

1. Go to Developers → Webhooks
2. Add endpoint: `https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy webhook signing secret

#### 4. Update Secrets

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

#### 5. Test Payments

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Exp: Any future date
- CVC: Any 3 digits

### Environment Variables

#### Frontend (.env)

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJI...
VITE_STRIPE_PUBLIC_KEY=pk_test_... # Optional
```

#### Edge Functions (Supabase Secrets)

```bash
# AI Features
OPENAI_API_KEY=sk-...

# Payments
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Auto-configured by Supabase
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Feature Activation Checklist

### ✅ Basic Features (No setup required)

- [x] Authentication (email/password)
- [x] Course management
- [x] Grade calculator
- [x] What-If scenarios
- [x] CSV export
- [x] PDF export

### 🔧 Advanced Features (Require setup)

#### AI Scanning

- [ ] Create `scans` storage bucket
- [ ] Set `OPENAI_API_KEY` secret
- [ ] Deploy `process-scan` function
- [ ] Test with sample images

**Test:**
1. Go to Scan page
2. Upload syllabus image
3. Should see AI-extracted data
4. Confirm to create course

#### AI Insights

- [ ] Set `OPENAI_API_KEY` secret
- [ ] Deploy `generate-insights` function
- [ ] Have at least 3 graded assignments

**Test:**
1. Open a course
2. Click "Insights"
3. Click "Generate Insights"
4. Should see predictions and suggestions

#### Stripe Payments

- [ ] Create Stripe account
- [ ] Set up products/prices
- [ ] Configure webhook
- [ ] Set secrets
- [ ] Add `VITE_STRIPE_PUBLIC_KEY` to .env

**Test:**
1. Go to Settings → Billing
2. Click "Upgrade to Premium"
3. Complete checkout with test card
4. Verify subscription updated

#### Admin Console

- [ ] Set admin email in code (or use custom claim)
- [ ] Access `/admin` route

**Test:**
1. Login with admin account
2. Go to `#/admin`
3. Should see user list and stats

## Deployment Options

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

**Pros:**
- Fast global CDN
- Automatic HTTPS
- Easy rollbacks
- Great performance

### Option 2: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=dist
```

### Option 3: Cloudflare Pages

1. Connect GitHub repo
2. Build command: `npm run build`
3. Output directory: `dist`
4. Add environment variables

### Option 4: Self-Hosted

```bash
# Build
npm run build

# Serve with any static server
npx serve dist

# Or upload dist/ to S3, nginx, etc.
```

## Monitoring & Maintenance

### Database Monitoring

In Supabase Dashboard:
- Check slow queries
- Monitor active connections
- Review RLS policy performance

### Edge Function Logs

```bash
# Real-time logs
supabase functions logs process-scan --follow

# Or view in dashboard
```

### Error Tracking

Add Sentry for production:

```bash
npm install @sentry/react

# Add to main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production",
});
```

### Performance

Check in browser DevTools:
- First load: ~300ms
- Time to interactive: ~500ms
- Bundle size: ~346KB (94KB gzipped)

## Troubleshooting

### AI Scanning Not Working

**Problem:** Scan returns errors or mock data
**Solution:**
1. Verify `OPENAI_API_KEY` is set: `supabase secrets list`
2. Check function logs: `supabase functions logs process-scan`
3. Test API key separately
4. Ensure storage bucket exists and is public

### Stripe Checkout Fails

**Problem:** Clicking upgrade does nothing
**Solution:**
1. Check `VITE_STRIPE_PUBLIC_KEY` in .env
2. Verify webhook is deployed and receiving events
3. Check webhook signing secret matches
4. Test with Stripe CLI: `stripe listen --forward-to https://...`

### Database Permission Errors

**Problem:** Users can't create/read data
**Solution:**
1. Verify RLS policies are enabled
2. Check user is authenticated
3. Run: `SELECT * FROM auth.users;` to confirm user exists
4. Review `DATABASE_SCHEMA.sql` policies

### Build Failures

**Problem:** `npm run build` fails
**Solution:**
1. Delete node_modules: `rm -rf node_modules`
2. Clear cache: `npm cache clean --force`
3. Reinstall: `npm install`
4. Check TypeScript errors: `npm run typecheck`

## Production Checklist

Before going live:

- [ ] Run `DATABASE_SCHEMA.sql` in production Supabase
- [ ] Create storage buckets
- [ ] Deploy all Edge Functions
- [ ] Set all required secrets
- [ ] Test signup/login flow
- [ ] Test course creation
- [ ] Test grade calculations
- [ ] Test AI scanning (if enabled)
- [ ] Test Stripe checkout (if enabled)
- [ ] Verify RLS with 2 test accounts
- [ ] Check mobile responsiveness
- [ ] Test exports (CSV, PDF)
- [ ] Monitor error logs for 24 hours
- [ ] Set up backups (automatic in Supabase)

## Scaling Considerations

### Database

Supabase free tier includes:
- 500MB database
- 1GB bandwidth
- 50,000 monthly active users

For growth:
- Upgrade to Pro plan
- Add database indexes
- Enable connection pooling
- Consider read replicas

### Edge Functions

Free tier:
- 500,000 function invocations/month
- 100 concurrent invocations

For high traffic:
- Cache responses when possible
- Use background jobs for heavy processing
- Consider rate limiting

### Storage

Free tier:
- 1GB storage
- 2GB bandwidth

For many scans:
- Compress images before upload
- Delete old scans after confirmation
- Upgrade storage plan

## Support & Resources

- **Documentation:** See README.md and SETUP_GUIDE.md
- **Database Schema:** DATABASE_SCHEMA.sql
- **API Status:** https://status.supabase.com
- **Stripe Dashboard:** https://dashboard.stripe.com
- **OpenAI Status:** https://status.openai.com

## Next Steps

1. **Enable AI Features:** Set OpenAI key and test scanning
2. **Set up Payments:** Configure Stripe for monetization
3. **Add Analytics:** Track user behavior and feature usage
4. **Mobile Apps:** Wrap with Capacitor for iOS/Android
5. **OAuth:** Add Google/Apple Sign-In
6. **Notifications:** Email/push for grade updates

Congratulations! You now have a fully-featured grade tracking application with AI capabilities.
