interface StatsCardProps {
  icon: string;
  label: string;
  value: number | string;
  color: 'blue' | 'green' | 'orange' | 'purple';
  index?: number;
}

export default function StatsCard({ icon, label, value, color, index = 0 }: StatsCardProps) {
  return (
    <div className="stat-card" style={{ animationDelay: `${index * 80}ms` }}>
      <div className={`stat-card-icon ${color}`}>{icon}</div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}
