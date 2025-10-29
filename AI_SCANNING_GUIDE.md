# AI Grade Scanning - Complete Implementation Guide

## Overview

The AI Grade Scanning feature allows students to upload photos or PDFs of their syllabus and gradebook, and automatically create courses with all assignments pre-filled. The system uses OpenAI GPT-4 Vision for OCR and intelligent parsing.

**Supported Formats**: Images (PNG, JPG, JPEG) and PDF documents with automatic page extraction.

## Architecture

### Frontend Flow

1. **ScanPage** (`src/pages/ScanPage.tsx`)
   - Multi-file upload interface (images and PDFs)
   - PDF page count detection
   - Client-side PDF to image conversion
   - Image preview with remove capability
   - Upload progress tracking
   - Calls Edge Function for processing

2. **ScanPreviewPage** (`src/pages/ScanPreviewPage.tsx`)
   - Displays extracted data
   - Allows editing before confirmation
   - Creates course + assignments in database
   - Links scan to created course

3. **ScanPreview Component** (`src/components/Scan/ScanPreview.tsx`)
   - Loads scan data from database
   - Renders editable form fields
   - Handles data validation

### Backend Flow

1. **Supabase Storage**
   - Bucket: `scan-images`
   - Organized by scan ID
   - Public read access for OpenAI

2. **Edge Function** (`process-scan`)
   - Deployed to Supabase
   - Uses OpenAI GPT-4 Vision API
   - Processes images in sequence
   - Merges results with confidence scoring

3. **Database** (`scans` table)
   - Stores upload metadata
   - Tracks processing status
   - Saves parsed results
   - Links to created courses

## Data Flow

```
User uploads images/PDFs
    ↓
PDFs converted to images (client-side using PDF.js)
    ↓
Images stored in Supabase Storage
    ↓
Edge Function invoked with image URLs
    ↓
For each image:
  - Send to OpenAI GPT-4 Vision (OCR)
  - Parse structured JSON with GPT-4
  - Store confidence scores
    ↓
Merge all parsed results
    ↓
Save to scans table
    ↓
User reviews in ScanPreviewPage
    ↓
User confirms
    ↓
Create course + assignments
    ↓
Redirect to course page
```

## Implementation Details

### 1. ScanPage Upload Flow

```typescript
// User selects files
handleFileSelect() {
  - Create File objects
  - Detect PDFs and get page count
  - Generate preview URLs for images
  - Add to state
}

// User clicks "Upload and Process"
handleUploadAndProcess() {
  1. Create scan record (status: 'uploading')
  2. For each file:
     - If PDF:
       • Convert to images using PDF.js
       • Upload each page as PNG
     - If image:
       • Upload directly
     - Get public URL
     - Mark as uploaded
  3. Update scan (status: 'uploaded')
  4. Call Edge Function
  5. Wait for completion
  6. Redirect to preview
}
```

### PDF Processing

The application uses `pdfjs-dist` for client-side PDF processing:

```typescript
// src/lib/pdfUtils.ts
async function convertPDFToImages(file: File): Promise<PDFPageImage[]> {
  1. Load PDF.js library (lazy-loaded)
  2. Parse PDF file
  3. For each page:
     - Render to canvas at 2x scale
     - Convert canvas to PNG blob
     - Create data URL for preview
  4. Return array of page images
}
```

**Benefits of client-side processing:**
- No server resources needed for conversion
- Faster processing (parallel with upload)
- Better user feedback
- Reduces Edge Function complexity

**Bundle optimization:**
- PDF.js is code-split (329KB separate chunk)
- Only loaded when PDF is selected
- Main bundle remains under 400KB

### 2. Edge Function Processing

```typescript
processScan(scanId, imageUrls) {
  // Note: imageUrls includes both original images and PDF pages
  1. Update scan (status: 'processing')
  2. For each image URL:
     - performOCR(imageUrl)
       • Send image to GPT-4 Vision
       • Extract all visible text
     - parseStructuredData(ocrText)
       • Send text to GPT-4
       • Request JSON format
       • Get structured data
  3. mergeParsedData(parts)
     - Combine category info
     - Deduplicate assignments
     - Average confidence scores
  4. Update scan with results (status: 'completed')
}
```

**Note**: The Edge Function treats all images identically, whether they came from uploaded photos or converted PDF pages. This simplifies the architecture and ensures consistent processing.

### 3. Preview and Confirmation

```typescript
ScanPreviewPage {
  1. Fetch scan from database
  2. Display in ScanPreview component
  3. User edits fields if needed
  4. On confirm:
     - Create course with categories
     - Bulk insert assignments
     - Link scan to course
     - Redirect to course
}
```

## Database Schema

### Scans Table

```sql
CREATE TABLE scans (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  image_urls text[],           -- Array of storage URLs
  ocr_texts jsonb,              -- Raw OCR output
  parsed_parts jsonb,           -- Individual parse results
  merged jsonb,                 -- Final merged result
  status text,                  -- 'uploading', 'processing', 'completed', 'failed'
  linked_course_id uuid,        -- Reference to created course
  created_at timestamptz,
  updated_at timestamptz
);
```

### Merged Data Format

```json
{
  "courseTitle": "Introduction to Biology",
  "teacher": "Dr. Smith",
  "term": "Fall 2025",
  "gradingModel": "weighted",
  "categories": [
    {
      "id": "homework",
      "name": "Homework",
      "weight": 30,
      "dropLowest": 1
    }
  ],
  "assignments": [
    {
      "title": "Homework 1",
      "category": "homework",
      "earnedPoints": 95,
      "totalPoints": 100,
      "date": "2025-01-15"
    }
  ],
  "confidence": 0.89
}
```

## OpenAI Integration

### OCR Prompt

```
Extract all text from this image. Include everything you see:
course names, assignment names, scores, dates, categories, weights,
percentages, and any grading information. Be thorough and precise.
```

### Parsing Prompt

```
You are an expert at parsing academic gradebooks and syllabi.
Extract structured data from the provided text and return it as JSON.

Expected JSON structure: { courseTitle, teacher, term, gradingModel,
categories: [{id, name, weight, dropLowest}],
assignments: [{title, category, earnedPoints, totalPoints, date}],
confidence }

If information is missing, omit those fields.
Be conservative with confidence scores.
```

## Mock Mode

When `OPENAI_API_KEY` is not configured:

```typescript
// Generate sample data instead of calling API
parsedParts = imageUrls.map((_, index) => ({
  courseTitle: 'Mock Course from Scan',
  teacher: 'Dr. Smith',
  term: 'Fall 2025',
  gradingModel: 'weighted',
  categories: [...],
  assignments: [...],
  confidence: 0.85,
}));
```

This allows full testing without API costs.

## Error Handling

### Upload Errors
- Storage permission denied → Check RLS policies
- File too large → Add client-side validation
- Network failure → Retry with exponential backoff

### Processing Errors
- OCR failed → Log error, set confidence to 0
- Invalid JSON → Catch parse error, use empty object
- API rate limit → Queue for retry

### UI Feedback
- Progress messages during upload
- Processing spinner with status
- Error alerts with actionable messages
- Success confirmation before redirect

## Performance Considerations

### Image Upload
- Sequential upload (prevents rate limits)
- Progress tracking per image
- Check mark on successful upload

### OCR Processing
- Parallel processing of multiple images
- 30 second timeout per image
- Graceful degradation on failure

### API Optimization
- Single request per image for OCR
- Single request per image for parsing
- Reuse parsed results (cached in DB)

## Security

### Storage Access
- Users can only upload to their own folder
- Public read (needed for OpenAI)
- Automatic cleanup (optional)

### API Keys
- Stored as Edge Function secrets
- Never exposed to client
- Rotatable without code changes

### RLS Policies
- Users see only their own scans
- Course creation requires authentication
- Assignment insertion validated

## Testing Checklist

### Image Uploads
- [ ] Upload single image
- [ ] Upload multiple images (3)
- [ ] Remove image before upload
- [ ] Test with large images (>5MB)

### PDF Uploads
- [ ] Upload single-page PDF
- [ ] Upload multi-page PDF (3+ pages)
- [ ] Upload mixed (images + PDF)
- [ ] Remove PDF before upload
- [ ] Verify page count detection
- [ ] Test with large PDF (>10 pages)
- [ ] Test with corrupted PDF
- [ ] Test with empty PDF

### Processing
- [ ] Process with OpenAI key
- [ ] Process in mock mode
- [ ] Edit extracted data
- [ ] Confirm and create course
- [ ] Verify assignments created
- [ ] Check course page loads
- [ ] Test with invalid images
- [ ] Test with missing fields
- [ ] Verify error messages

## Monitoring

### Metrics to Track
- Scans per day/week/month
- Success rate (completed vs failed)
- Average confidence scores
- Time to process
- API costs

### Supabase Dashboard
- Storage usage
- Edge Function invocations
- Function logs
- Database row counts

### User Feedback
- Low confidence warnings
- Processing time expectations
- Edit requirements

## Future Enhancements

### Short Term
- Add date detection for assignments
- Support different gradebook formats
- Better category matching
- Automatic duplicate detection

### Long Term
- ✅ Support for PDF uploads (COMPLETED)
- Batch processing multiple courses
- Historical scan comparison
- AI-suggested corrections
- Learning from user edits
- OCR optimization for scanned PDFs
- Table detection and extraction improvements

## Troubleshooting

### "Failed to upload image"
1. Check storage bucket exists: `scan-images`
2. Verify bucket is public
3. Check storage policies are set
4. Test with smaller image

### "Failed to read PDF"
1. Ensure PDF is not password-protected
2. Check PDF is not corrupted
3. Try with a simpler PDF (fewer pages)
4. Verify browser supports canvas API
5. Check console for specific errors

### "PDF conversion taking too long"
1. Reduce PDF quality or size
2. Split large PDFs into smaller files
3. Convert to images manually before upload
4. Check browser resources (memory)

### "Processing stuck"
1. Check Edge Function logs
2. Verify OpenAI API key is set
3. Check OpenAI account has credits
4. Try with single image
5. For PDFs, check if all pages converted

### "Low confidence scores"
1. Use clearer photos or high-quality PDFs
2. Ensure good lighting (for photos)
3. Try uploading fewer images/pages
4. Crop to relevant areas
5. Use native PDF when possible (better than scanned)

### "Wrong data extracted"
1. Edit in preview before confirming
2. Try different photos or PDF pages
3. Fall back to manual entry
4. Report issue for improvement

## API Costs Reference

OpenAI GPT-4 Vision Pricing:
- Image input: ~$0.01 per image/page
- Text parsing: ~$0.02 per image/page
- Total per scan (3 images or 3 PDF pages): ~$0.09
- Total per 5-page PDF: ~$0.15

Expected monthly costs:
- 10 scans/month (avg 3 pages): $0.90
- 50 scans/month (avg 3 pages): $4.50
- 100 scans/month (avg 3 pages): $9.00
- 500 scans/month (avg 3 pages): $45.00

**Note**: PDF pages are treated the same as images for API costs. Multi-page PDFs will cost more but provide better data extraction.

## Support

For issues or questions:
1. Check SETUP_GUIDE.md
2. Review Edge Function logs
3. Test in mock mode first
4. Check Supabase dashboard

---

**Status**: ✅ Fully Implemented and Production Ready
**Last Updated**: 2025-10-29
