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

## Part 4: AI Scanning Setup

The AI scanning feature is now implemented! Follow these steps to enable it.

### Step 1: Create Storage Bucket

1. Go to your Supabase dashboard
2. Click **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Name it: `scan-images`
5. Make it **Public** (so processed images can be accessed)
6. Click **Create bucket**

### Step 2: Set up Storage Policies

The storage policies are already configured! But if you need to verify or recreate them, run this SQL:

```sql
-- Allow authenticated users to upload images (to their own folder)
CREATE POLICY "storage_insert_own_scan_images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'scan-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to read their own images
CREATE POLICY "storage_select_own_scan_images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'scan-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to update their own images
CREATE POLICY "storage_update_own_scan_images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'scan-images' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'scan-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to delete their own images
CREATE POLICY "storage_delete_own_scan_images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'scan-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access (needed for OpenAI to access images)
CREATE POLICY "Public read access for scan images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'scan-images');
```

**Important**: Files must be uploaded with paths starting with the user's ID (e.g., `user-id/scan-id/file.jpg`). This is handled automatically by the app.

### Step 3: Get OpenAI API Key (Optional)

The app works in mock mode without an API key, but for real AI scanning:

1. Sign up at [https://platform.openai.com](https://platform.openai.com)
2. Go to **API Keys**
3. Click **Create new secret key**
4. Copy the key (starts with `sk-...`)
5. **IMPORTANT**: You'll only see this once, save it securely!

### Step 4: Configure Edge Function Secret

The `processScan` Edge Function is already deployed. To enable real AI:

1. In your Supabase dashboard, go to **Edge Functions**
2. You should see `process-scan` listed
3. Click on it, then click **Settings**
4. Add a new secret:
   - Name: `OPENAI_API_KEY`
   - Value: Your OpenAI API key (from Step 3)
5. Click **Save**

### Step 5: Test AI Scanning

1. Navigate to the Scan page in your app (Camera icon in nav)
2. Upload 1-3 photos of:
   - Your syllabus (showing categories and weights)
   - Your gradebook (showing assignment names and scores)
3. Click **Upload and Process**
4. Wait for processing (should take 10-30 seconds)
5. Review the extracted data in the preview
6. Edit any incorrect fields
7. Click **Confirm** to create your course!

### How It Works

1. **Upload**: Images are uploaded to Supabase Storage (`scan-images` bucket)
2. **OCR**: Edge Function sends images to OpenAI GPT-4 Vision for text extraction
3. **Parsing**: GPT-4 converts extracted text into structured JSON (course info, categories, assignments)
4. **Merging**: Multiple image results are merged with confidence scoring
5. **Preview**: You review and edit the extracted data
6. **Create**: Course and assignments are created in your database

### Mock Mode (No API Key)

If you don't configure an OpenAI API key, the app runs in mock mode:
- Generates sample course data
- Shows you the full user experience
- Perfect for testing and development
- No API costs

### Troubleshooting

**Problem**: Images not uploading
**Solution**: Verify storage bucket exists and policies are set

**Problem**: Processing stuck
**Solution**: Check Edge Function logs in Supabase dashboard

**Problem**: Low confidence scores
**Solution**:
- Use clearer, well-lit photos
- Ensure text is readable
- Try uploading fewer images (1-2 is often better than 3+)

**Problem**: Wrong data extracted
**Solution**:
- Edit fields in preview before confirming
- Try different photos with better visibility
- Manually adjust after creation

### API Costs

OpenAI GPT-4 Vision pricing (as of 2025):
- ~$0.01 per image for OCR
- ~$0.02 per image for parsing
- Total: ~$0.03-$0.09 per scan (1-3 images)

For 100 scans/month: ~$3-9/month in API costs

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
