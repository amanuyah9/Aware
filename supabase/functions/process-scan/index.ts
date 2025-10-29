import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ScanRequest {
  scanId: string;
  imageUrls: string[];
}

interface ParsedData {
  courseTitle?: string;
  teacher?: string;
  term?: string;
  gradingModel?: 'weighted' | 'points';
  categories?: Array<{
    id: string;
    name: string;
    weight: number;
    dropLowest?: number;
  }>;
  assignments?: Array<{
    title: string;
    category: string;
    earnedPoints: number;
    totalPoints: number;
    date?: string;
  }>;
  confidence: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  let scanId: string | undefined;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { scanId: requestScanId, imageUrls }: ScanRequest = await req.json();
    scanId = requestScanId;

    if (!scanId || !imageUrls || imageUrls.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing scanId or imageUrls' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await supabase
      .from('scans')
      .update({ status: 'processing' })
      .eq('id', scanId);

    let parsedParts: ParsedData[] = [];

    if (!openaiKey) {
      console.log('No OpenAI key found, using mock mode');
      parsedParts = imageUrls.map((_, index) => ({
        courseTitle: 'Mock Course from Scan',
        teacher: 'Dr. Smith',
        term: 'Fall 2025',
        gradingModel: 'weighted' as const,
        categories: [
          { id: 'homework', name: 'Homework', weight: 30, dropLowest: 1 },
          { id: 'exams', name: 'Exams', weight: 50, dropLowest: 0 },
          { id: 'projects', name: 'Projects', weight: 20, dropLowest: 0 },
        ],
        assignments: [
          {
            title: `Assignment ${index + 1}`,
            category: 'homework',
            earnedPoints: 85,
            totalPoints: 100,
            date: '2025-01-15',
          },
        ],
        confidence: 0.85,
      }));
    } else {
      for (let i = 0; i < imageUrls.length; i++) {
        const imageUrl = imageUrls[i];
        
        try {
          const ocrText = await performOCR(imageUrl, openaiKey);
          const parsed = await parseStructuredData(ocrText, openaiKey);
          parsedParts.push(parsed);
        } catch (error) {
          console.error(`Error processing image ${i}:`, error);
          parsedParts.push({
            confidence: 0,
          });
        }
      }
    }

    const merged = mergeParsedData(parsedParts);

    const { error: updateError } = await supabase
      .from('scans')
      .update({
        parsed_parts: parsedParts,
        merged: merged,
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', scanId);

    if (updateError) {
      console.error('Error updating scan:', updateError);
      throw new Error(`Failed to save scan results: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        scanId,
        merged,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in processScan:', error);

    if (scanId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        await supabase
          .from('scans')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', scanId);
      } catch (updateErr) {
        console.error('Failed to update scan status to failed:', updateErr);
      }
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function performOCR(imageUrl: string, openaiKey: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all text from this image. Include everything you see: course names, assignment names, scores, dates, categories, weights, percentages, and any grading information. Be thorough and precise.',
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

async function parseStructuredData(
  ocrText: string,
  openaiKey: string
): Promise<ParsedData> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert at parsing academic gradebooks and syllabi. Extract structured data from the provided text and return it as JSON.

Expected JSON structure:
{
  "courseTitle": "Course name",
  "teacher": "Instructor name",
  "term": "Semester/term",
  "gradingModel": "weighted" or "points",
  "categories": [
    {
      "id": "lowercase_no_spaces",
      "name": "Category Name",
      "weight": percentage as number (0-100),
      "dropLowest": number of assignments to drop
    }
  ],
  "assignments": [
    {
      "title": "Assignment name",
      "category": "category_id matching above",
      "earnedPoints": number,
      "totalPoints": number,
      "date": "YYYY-MM-DD"
    }
  ],
  "confidence": confidence score 0-1
}

If information is missing, omit those fields. Be conservative with confidence scores.`,
        },
        {
          role: 'user',
          content: ocrText,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '{}';
  return JSON.parse(content);
}

function mergeParsedData(parts: ParsedData[]): ParsedData {
  if (parts.length === 0) {
    return { confidence: 0 };
  }

  if (parts.length === 1) {
    return parts[0];
  }

  const merged: ParsedData = {
    confidence: 0,
  };

  const validParts = parts.filter((p) => p.confidence > 0.5);

  if (validParts.length === 0) {
    return parts[0] || merged;
  }

  merged.courseTitle = validParts[0].courseTitle;
  merged.teacher = validParts[0].teacher;
  merged.term = validParts[0].term;
  merged.gradingModel = validParts[0].gradingModel;

  const categoryMap = new Map<string, any>();
  validParts.forEach((part) => {
    part.categories?.forEach((cat) => {
      if (!categoryMap.has(cat.id)) {
        categoryMap.set(cat.id, cat);
      }
    });
  });
  merged.categories = Array.from(categoryMap.values());

  const assignmentMap = new Map<string, any>();
  validParts.forEach((part) => {
    part.assignments?.forEach((assignment) => {
      const key = `${assignment.category}_${assignment.title}`;
      if (!assignmentMap.has(key)) {
        assignmentMap.set(key, assignment);
      }
    });
  });
  merged.assignments = Array.from(assignmentMap.values());

  const avgConfidence =
    validParts.reduce((sum, p) => sum + p.confidence, 0) / validParts.length;
  merged.confidence = avgConfidence;

  return merged;
}
