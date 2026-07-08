import { createClient } from '@/lib/supabase/server';
import AssignmentCard from '@/components/AssignmentCard';

export default async function StudentDashboard() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Fetch all assignments
  const { data: assignments } = await supabase
    .from('assignments')
    .select('*')
    .order('created_at', { ascending: false });

  // Fetch student's submissions
  const { data: submissions } = await supabase
    .from('submissions')
    .select('*')
    .eq('student_id', user!.id);

  // Map submissions by assignment_id for quick lookup
  const submissionMap = new Map(
    (submissions || []).map(s => [s.assignment_id, s])
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">📋 Bài tập của tôi</h1>
        <p className="page-subtitle">
          Xem và nộp bài tập được giao từ giáo viên
        </p>
      </div>

      {!assignments || assignments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <h3 className="empty-state-title">Chưa có bài tập</h3>
          <p className="empty-state-desc">
            Giáo viên chưa giao bài tập nào. Hãy quay lại sau nhé!
          </p>
        </div>
      ) : (
        <div className="assignments-grid">
          {assignments.map((assignment, index) => {
            const submission = submissionMap.get(assignment.id);
            let status: 'not_submitted' | 'pending' | 'grading' | 'graded' = 'not_submitted';
            if (submission) {
              status = submission.status as typeof status;
            }
            return (
              <AssignmentCard
                key={assignment.id}
                id={assignment.id}
                title={assignment.title}
                description={assignment.description}
                dueDate={assignment.due_date}
                status={status}
                score={submission?.score}
                href={`/assignments/${assignment.id}`}
                index={index}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
