import { createClient } from '@/lib/supabase/server';
import StatsCard from '@/components/StatsCard';
import Link from 'next/link';

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Fetch stats
  const { count: assignmentCount } = await supabase
    .from('assignments')
    .select('*', { count: 'exact', head: true });

  const { count: submissionCount } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true });

  const { count: gradedCount } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'graded');

  const { count: studentCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student');

  // Fetch recent submissions
  const { data: recentSubmissions } = await supabase
    .from('submissions')
    .select(`
      *,
      profiles:student_id(full_name, class_grade),
      assignments:assignment_id(title)
    `)
    .order('submitted_at', { ascending: false })
    .limit(5);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">📊 Tổng quan</h1>
        <p className="page-subtitle">Quản lý bài tập và theo dõi tiến độ học sinh</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatsCard icon="📝" label="Bài tập" value={assignmentCount || 0} color="blue" index={0} />
        <StatsCard icon="📤" label="Bài nộp" value={submissionCount || 0} color="purple" index={1} />
        <StatsCard icon="✅" label="Đã chấm" value={gradedCount || 0} color="green" index={2} />
        <StatsCard icon="👨‍🎓" label="Học sinh" value={studentCount || 0} color="orange" index={3} />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4 mb-8">
        <Link href="/admin/assignments/new" className="btn btn-primary">
          ➕ Tạo bài tập mới
        </Link>
        <Link href="/admin/assignments" className="btn btn-secondary">
          📋 Xem tất cả bài tập
        </Link>
      </div>

      {/* Recent Submissions */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">📥 Bài nộp gần đây</h2>
        </div>

        {!recentSubmissions || recentSubmissions.length === 0 ? (
          <p className="text-sm text-secondary">Chưa có bài nộp nào.</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Học sinh</th>
                  <th>Lớp</th>
                  <th>Bài tập</th>
                  <th>Trạng thái</th>
                  <th>Điểm</th>
                  <th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {recentSubmissions.map((sub) => (
                  <tr key={sub.id}>
                    <td style={{ fontWeight: 500 }}>
                      {(sub.profiles as { full_name: string })?.full_name || 'N/A'}
                    </td>
                    <td>{(sub.profiles as { class_grade: string })?.class_grade || '—'}</td>
                    <td>{(sub.assignments as { title: string })?.title || 'N/A'}</td>
                    <td>
                      <span className={`badge badge-${sub.status}`}>
                        {sub.status === 'graded' ? 'Đã chấm' : sub.status === 'grading' ? 'Đang chấm' : sub.status === 'error' ? 'Lỗi' : 'Đã nộp'}
                      </span>
                    </td>
                    <td>
                      {sub.score !== null ? (
                        <strong>{sub.score}/100</strong>
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
