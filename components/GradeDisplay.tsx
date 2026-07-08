interface GradeDisplayProps {
  score: number;
  feedback: string;
  gradedAt?: string;
}

function getScoreCategory(score: number) {
  if (score >= 80) return { label: 'Xuất sắc', className: 'excellent' };
  if (score >= 65) return { label: 'Tốt', className: 'good' };
  if (score >= 50) return { label: 'Trung bình', className: 'average' };
  return { label: 'Cần cải thiện', className: 'poor' };
}

export default function GradeDisplay({ score, feedback, gradedAt }: GradeDisplayProps) {
  const category = getScoreCategory(score);

  const formattedDate = gradedAt
    ? new Date(gradedAt).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="grade-container">
      <div className="grade-header">
        <div className={`grade-score-circle ${category.className}`}>
          {score}
        </div>
        <div>
          <div className="grade-label">Điểm số</div>
          <div className="grade-title">{category.label}</div>
          {formattedDate && (
            <div className="text-xs text-muted" style={{ marginTop: 'var(--space-1)' }}>
              Chấm lúc: {formattedDate}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 'var(--space-3)' }}>
        <h4 style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)' }}>
          📝 Nhận xét của AI
        </h4>
        <div className="grade-feedback">{feedback}</div>
      </div>
    </div>
  );
}
