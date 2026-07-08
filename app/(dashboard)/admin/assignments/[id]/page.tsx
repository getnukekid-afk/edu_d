import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminAssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: assignment } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', id)
    .single();

  if (!assignment) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">❌</div>
        <h3 className="empty-state-title">Không tìm thấy bài tập</h3>
        <Link href="/admin/assignments" className="btn btn-primary">
          Quay lại
        </Link>
      </div>
    );
  }

  const { data: submissions } = await supabase
    .from('submissions')
    .select(`
      *,
      profiles:student_id(full_name, class_grade)
    `)
    .eq('assignment_id', id)
    .order('submitted_at', { ascending: false });

  const gradedCount = (submissions || []).filter(s => s.status === 'graded').length;
  const avgScore = (submissions || [])
    .filter(s => s.score !== null)
    .reduce((sum, s, _, arr) => sum + (s.score || 0) / arr.length, 0);

  return (
    <div className="animate-fade-in">
      <Link href="/admin/assignments" className="btn btn-ghost mb-6">
        ← Quay lại danh sách
      </Link>

      {/* Assignment Info */}
      <div className="card mb-6">
        <h1 className="card-title" style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-3)' }}>
          {assignment.title}
        </h1>
        <p className="text-sm text-secondary" style={{ lineHeight: 1.7, marginBottom: 'var(--space-4)' }}>
          {assignment.description}
        </p>
        <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
          <span className="badge badge-grading">
            {submissions?.length || 0} bài nộp
          </span>
          <span className="badge badge-graded">
            {gradedCount} đã chấm
          </span>
          {avgScore > 0 && (
            <span className="badge badge-admin">
              TB: {Math.round(avgScore)}/100
            </span>
          )}
        </div>
      </div>

      {/* Answer Key Preview */}
      <div className="card mb-6">
        <h3 className="card-title" style={{ marginBottom: 'var(--space-3)' }}>
          🔑 Đáp án
        </h3>
        <p className="text-sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: 'var(--color-text-secondary)' }}>
          {assignment.answer_key}
        </p>
        {assignment.answer_key_image_url && (
          <div className="upload-preview mt-4">
            <img src={assignment.answer_key_image_url} alt="Đáp án hình ảnh" />
          </div>
        )}
      </div>

      {/* Submissions Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">📥 Danh sách bài nộp</h2>
        </div>

        {!submissions || submissions.length === 0 ? (
          <p className="text-sm text-secondary">Chưa có học sinh nộp bài.</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Học sinh</th>
                  <th>Lớp</th>
                  <th>Trạng thái</th>
                  <th>Điểm</th>
                  <th>Thời gian nộp</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => (
                  <tr key={sub.id}>
                    <td style={{ fontWeight: 500 }}>
                      {(sub.profiles as { full_name: string })?.full_name || 'N/A'}
                    </td>
                    <td>{(sub.profiles as { class_grade: string })?.class_grade || '—'}</td>
                    <td>
                      <span className={`badge badge-${sub.status}`}>
                        {sub.status === 'graded' ? 'Đã chấm' :
                         sub.status === 'grading' ? 'Đang chấm' :
                         sub.status === 'error' ? 'Lỗi' : 'Đã nộp'}
                      </span>
                    </td>
                    <td>
                      {sub.score !== null ? (
                        <strong style={{
                          color: sub.score >= 80 ? 'var(--color-success)' :
                                 sub.score >= 50 ? 'var(--color-primary)' :
                                 'var(--color-error)'
                        }}>
                          {sub.score}/100
                        </strong>
                      ) : '—'}
                    </td>
                    <td className="text-sm text-muted">
                      {new Date(sub.submitted_at).toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <Link
                        href={`/admin/submissions/${sub.id}`}
                        className="btn btn-ghost btn-sm"
                      >
                        Xem →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
