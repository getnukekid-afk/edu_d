'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ImageUploader from '@/components/ImageUploader';
import GradeDisplay from '@/components/GradeDisplay';
import StatusBadge from '@/components/StatusBadge';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string | null;
  created_at: string;
}

interface Submission {
  id: string;
  image_url: string;
  score: number | null;
  feedback: string | null;
  status: 'pending' | 'grading' | 'graded' | 'error';
  submitted_at: string;
  graded_at: string | null;
}

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  // Poll for grading result
  useEffect(() => {
    if (submission?.status === 'grading' || submission?.status === 'pending') {
      const interval = setInterval(async () => {
        const { data } = await supabase
          .from('submissions')
          .select('*')
          .eq('id', submission.id)
          .single();

        if (data && data.status === 'graded') {
          setSubmission(data);
          clearInterval(interval);
        } else if (data && data.status === 'error') {
          setSubmission(data);
          clearInterval(interval);
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [submission?.id, submission?.status, supabase]);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: assignmentData } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', params.id)
      .single();

    setAssignment(assignmentData);

    const { data: submissionData } = await supabase
      .from('submissions')
      .select('*')
      .eq('assignment_id', params.id)
      .eq('student_id', user.id)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    setSubmission(submissionData);
    setLoading(false);
  }

  async function handleSubmit() {
    if (!selectedFile || !assignment) return;

    setUploading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Chưa đăng nhập');

      // Upload image
      const fileName = `${user.id}/${assignment.id}/${Date.now()}.${selectedFile.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from('submissions')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('submissions')
        .getPublicUrl(fileName);

      // Create submission record
      const { data: newSubmission, error: insertError } = await supabase
        .from('submissions')
        .insert({
          assignment_id: assignment.id,
          student_id: user.id,
          image_url: publicUrl,
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setSubmission(newSubmission);
      setSelectedFile(null);

      // Trigger AI grading
      fetch('/api/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: newSubmission.id }),
      });

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi nộp bài';
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  if (!assignment) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">❌</div>
        <h3 className="empty-state-title">Không tìm thấy bài tập</h3>
        <button className="btn btn-primary" onClick={() => router.push('/dashboard')}>
          Quay lại
        </button>
      </div>
    );
  }

  const formattedDate = assignment.due_date
    ? new Date(assignment.due_date).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="animate-fade-in">
      <button
        className="btn btn-ghost mb-6"
        onClick={() => router.push('/dashboard')}
      >
        ← Quay lại
      </button>

      {/* Assignment Info */}
      <div className="card mb-6">
        <div className="card-header">
          <h1 className="card-title">{assignment.title}</h1>
          {submission ? (
            <StatusBadge status={submission.status} />
          ) : (
            <StatusBadge status="not_submitted" />
          )}
        </div>
        <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, fontSize: 'var(--font-size-sm)' }}>
          {assignment.description}
        </p>
        {formattedDate && (
          <p className="text-xs text-muted mt-4">
            📅 Hạn nộp: {formattedDate}
          </p>
        )}
      </div>

      {/* Upload Section — only show if not yet submitted or if graded */}
      {(!submission || submission.status === 'graded' || submission.status === 'error') && (
        <div className="card mb-6">
          <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>
            📷 Nộp bài tập
          </h3>
          {submission && submission.status === 'graded' && (
            <p className="text-sm text-secondary mb-4">
              Bạn có thể nộp lại bài tập nếu muốn cải thiện điểm số.
            </p>
          )}

          <ImageUploader
            onFileSelected={setSelectedFile}
            disabled={uploading}
          />

          {error && (
            <div className="auth-message auth-message-error mt-4">
              {error}
            </div>
          )}

          {selectedFile && (
            <button
              className="btn btn-primary btn-lg w-full mt-6"
              onClick={handleSubmit}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span>
                  Đang nộp bài...
                </>
              ) : (
                '📤 Nộp bài'
              )}
            </button>
          )}
        </div>
      )}

      {/* Grading in progress */}
      {submission && (submission.status === 'pending' || submission.status === 'grading') && (
        <div className="card mb-6" style={{ textAlign: 'center' }}>
          <div className="loading-overlay" style={{ padding: 'var(--space-8)' }}>
            <div className="spinner spinner-lg"></div>
            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
              Đang chấm bài...
            </h3>
            <p className="text-sm text-secondary">
              AI đang phân tích và chấm bài tập của bạn. Vui lòng đợi trong giây lát.
            </p>
          </div>
        </div>
      )}

      {/* Submitted Image */}
      {submission && submission.image_url && (
        <div className="card mb-6">
          <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>
            🖼️ Bài tập đã nộp
          </h3>
          <div className="upload-preview">
            <img src={submission.image_url} alt="Bài tập đã nộp" />
          </div>
          <p className="text-xs text-muted mt-4">
            Nộp lúc: {new Date(submission.submitted_at).toLocaleString('vi-VN')}
          </p>
        </div>
      )}

      {/* Grade Result */}
      {submission && submission.status === 'graded' && submission.score !== null && submission.feedback && (
        <GradeDisplay
          score={submission.score}
          feedback={submission.feedback}
          gradedAt={submission.graded_at || undefined}
        />
      )}

      {/* Error State */}
      {submission && submission.status === 'error' && (
        <div className="card mb-6">
          <div className="auth-message auth-message-error">
            ⚠️ Có lỗi xảy ra trong quá trình chấm bài. Vui lòng thử nộp lại.
          </div>
        </div>
      )}
    </div>
  );
}
