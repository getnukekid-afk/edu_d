export default function LoadingSpinner({ text = 'Đang tải...' }: { text?: string }) {
  return (
    <div className="loading-overlay">
      <div className="spinner spinner-lg"></div>
      <span>{text}</span>
    </div>
  );
}
