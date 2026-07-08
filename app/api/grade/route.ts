import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { gradeSubmission } from '@/lib/ai/grading';

export async function POST(request: NextRequest) {
  try {
    const { submissionId } = await request.json();

    if (!submissionId) {
      return NextResponse.json(
        { error: 'submissionId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch submission with assignment data
    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select(`
        *,
        assignments:assignment_id(answer_key, answer_key_image_url)
      `)
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    const assignment = submission.assignments as {
      answer_key: string;
      answer_key_image_url: string | null;
    };

    // Update status to grading
    await supabase
      .from('submissions')
      .update({ status: 'grading' })
      .eq('id', submissionId);

    try {
      // Call AI grading
      const result = await gradeSubmission({
        answerKey: assignment.answer_key,
        answerKeyImageUrl: assignment.answer_key_image_url,
        studentImageUrl: submission.image_url,
      });

      // Save grading result
      await supabase
        .from('submissions')
        .update({
          score: result.score,
          feedback: result.feedback,
          status: 'graded',
          ai_raw_response: result,
          graded_at: new Date().toISOString(),
        })
        .eq('id', submissionId);

      return NextResponse.json({ success: true, result });

    } catch (aiError) {
      console.error('AI grading failed:', aiError);

      // Update status to error
      await supabase
        .from('submissions')
        .update({
          status: 'error',
          ai_raw_response: { error: String(aiError) },
        })
        .eq('id', submissionId);

      return NextResponse.json(
        { error: 'AI grading failed' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Grade API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
