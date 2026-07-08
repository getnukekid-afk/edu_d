import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import GradeDisplay from '@/components/GradeDisplay';

export default async function AdminSubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: submission } = await supabase
    .from('submissions')
    .select(`
      *,
      profiles:student_id(full_name, class_grade, date_of_birth),
      assignments:assignment_id(title, description, answer_key)
    `)
    .eq('id', id)
    .single();

  if (!submission) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">❌</div>
        <h3 className="empty-state-title">Không tìm thấy bài nộp</h3>
        <Link href="/admin" className="btn btn-primary">
          Quay lại
        </Link>
      </div>
    );
  }

  const profile = submission.profiles as { full_name: string; class_grade: string; date_of_birth: string } | null;
  const assignment = submission.assignments as { title: string; description: string; answer_key: string } | null;

  return (
    <div className="animate-fade-in">
      <Link href={`/admin/assignments/${submission.assignment_id}`} className="btn btn-ghost mb-6">
        ← Quay lại
      </Link>

      <div className="page-header">
        <h1 className="page-title">📄 Chi tiết bài nộp</h1>
      </div>

      {/* Student Info */}
      <div className="card mb-6">
        <h3 className="card-title" style={{ marginBottom: 'var(--space-3)' }}>
          👨‍🎓 Thông tin học sinh
        </h3>
        <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
          <div>
            <div className="text-xs text-muted">Họ và tên</div>
            <div style={{ fontWeight: 500 }}>{profile?.full_name || 'N/A'}</div>
          </div>
          <div>
            <div className="text-xs text-muted">Lớp</div>
            <div style={{ fontWeight: 500 }}>{profile?.class_grade || 'N/A'}</div>
          </div>
          <div>
            <div className="text-xs text-muted">Bài tập</div>
            <div style={{ fontWeight: 500 }}>{assignment?.title || 'N/A'}</div>
          </div>
          <div>
            <div className="text-xs text-muted">Thời gian nộp</div>
            <div style={{ fontWeight: 500 }}>
              {new Date(submission.submitted_at).toLocaleString('vi-VN')}
            </div>
          </div>
        </div>
      </div>

      {/* Submitted Image */}
      <div className="card mb-6">
        <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>
          🖼️ Bài tập đã nộp
        </h3>
        <div className="upload-preview">
          <img src={submission.image_url} alt="Bài tập đã nộp" />
        </div>
      </div>

      {/* AI Grade */}
      {submission.status === 'graded' && submission.score !== null && submission.feedback && (
        <div className="mb-6">
          <GradeDisplay
            score={submission.score}
            feedback={submission.feedback}
            gradedAt={submission.graded_at}
          />
        </div>
      )}

      {submission.status === 'grading' && (
        <div className="card mb-6" style={{ textAlign: 'center' }}>
          <div className="loading-overlay" style={{ padding: 'var(--space-8)' }}>
            <div className="spinner spinner-lg"></div>
            <p className="text-sm text-secondary">Đang chấm bài...</p>
          </div>
        </div>
      )}

      {submission.status === 'error' && (
        <div className="card mb-6">
          <div className="auth-message auth-message-error">
            ⚠️ Có lỗi xảy ra trong quá trình chấm bài.
          </div>
        </div>
      )}
    </div>
  );
}
