import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminAssignmentsPage() {
  const supabase = await createClient();

  const { data: assignments } = await supabase
    .from('assignments')
    .select('*')
    .order('created_at', { ascending: false });

  // Get submission counts for each assignment
  const assignmentIds = (assignments || []).map(a => a.id);
  let submissionCounts: Record<string, number> = {};

  if (assignmentIds.length > 0) {
    const { data: subs } = await supabase
      .from('submissions')
      .select('assignment_id')
      .in('assignment_id', assignmentIds);

    if (subs) {
      submissionCounts = subs.reduce((acc, sub) => {
        acc[sub.assignment_id] = (acc[sub.assignment_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">📝 Quản lý bài tập</h1>
          <p className="page-subtitle">Tạo và quản lý các bài tập cho học sinh</p>
        </div>
        <Link href="/admin/assignments/new" className="btn btn-primary">
          ➕ Tạo bài tập mới
        </Link>
      </div>

      {!assignments || assignments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <h3 className="empty-state-title">Chưa có bài tập nào</h3>
          <p className="empty-state-desc">
            Bắt đầu bằng cách tạo bài tập đầu tiên cho học sinh.
          </p>
          <Link href="/admin/assignments/new" className="btn btn-primary">
            ➕ Tạo bài tập đầu tiên
          </Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Mô tả</th>
                <th>Hạn nộp</th>
                <th>Bài nộp</th>
                <th>Ngày tạo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td style={{ fontWeight: 600 }}>{assignment.title}</td>
                  <td className="text-secondary" style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {assignment.description}
                  </td>
                  <td className="text-sm">
                    {assignment.due_date
                      ? new Date(assignment.due_date).toLocaleDateString('vi-VN')
                      : '—'}
                  </td>
                  <td>
                    <span className="badge badge-grading">
                      {submissionCounts[assignment.id] || 0} bài
                    </span>
                  </td>
                  <td className="text-sm text-muted">
                    {new Date(assignment.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td>
                    <Link
                      href={`/admin/assignments/${assignment.id}`}
                      className="btn btn-ghost btn-sm"
                    >
                      Xem chi tiết →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
