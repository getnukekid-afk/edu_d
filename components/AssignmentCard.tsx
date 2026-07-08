import Link from 'next/link';

interface AssignmentCardProps {
  id: string;
  title: string;
  description: string;
  dueDate?: string;
  status?: 'pending' | 'grading' | 'graded' | 'not_submitted';
  score?: number | null;
  href: string;
  index?: number;
}

const statusLabels: Record<string, string> = {
  not_submitted: 'Chưa nộp',
  pending: 'Đã nộp',
  grading: 'Đang chấm',
  graded: 'Đã chấm',
};

const statusClasses: Record<string, string> = {
  not_submitted: 'badge-pending',
  pending: 'badge-grading',
  grading: 'badge-grading',
  graded: 'badge-graded',
};

export default function AssignmentCard({
  id,
  title,
  description,
  dueDate,
  status = 'not_submitted',
  score,
  href,
  index = 0,
}: AssignmentCardProps) {
  const formattedDate = dueDate
    ? new Date(dueDate).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : null;

  return (
    <Link
      href={href}
      className="assignment-card"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="assignment-card-header">
        <h3 className="assignment-card-title">{title}</h3>
        <span className={`badge ${statusClasses[status]}`}>
          {statusLabels[status]}
        </span>
      </div>
      <p className="assignment-card-desc">{description}</p>
      <div className="assignment-card-footer">
        {formattedDate && (
          <span className="assignment-card-date">
            📅 Hạn nộp: {formattedDate}
          </span>
        )}
        {status === 'graded' && score !== null && score !== undefined && (
          <span className={`badge ${score >= 80 ? 'badge-graded' : score >= 50 ? 'badge-grading' : 'badge-error'}`}>
            Điểm: {score}/100
          </span>
        )}
      </div>
    </Link>
  );
}
