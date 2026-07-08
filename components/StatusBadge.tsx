interface StatusBadgeProps {
  status: 'pending' | 'grading' | 'graded' | 'error' | 'not_submitted';
}

const labels: Record<string, string> = {
  not_submitted: 'Chưa nộp',
  pending: 'Đã nộp',
  grading: 'Đang chấm...',
  graded: 'Đã chấm',
  error: 'Lỗi',
};

const classes: Record<string, string> = {
  not_submitted: 'badge-pending',
  pending: 'badge-grading',
  grading: 'badge-grading',
  graded: 'badge-graded',
  error: 'badge-error',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`badge ${classes[status]}`}>
      {status === 'grading' && (
        <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2, marginRight: 4 }}></span>
      )}
      {labels[status]}
    </span>
  );
}
