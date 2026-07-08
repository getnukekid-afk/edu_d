'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signUp } from '@/app/actions/auth';

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await signUp(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.success) {
      setSuccess(true);
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>✉️</div>
          <h1 className="auth-title">Kiểm tra email của bạn</h1>
          <p className="auth-subtitle" style={{ marginBottom: 'var(--space-6)' }}>
            Chúng tôi đã gửi liên kết xác minh đến email của bạn.
            Vui lòng kiểm tra hộp thư (và thư mục spam) để hoàn tất đăng ký.
          </p>
          <div className="auth-message auth-message-success">
            Sau khi xác minh email, bạn có thể đăng nhập vào tài khoản.
          </div>
          <div className="auth-footer" style={{ marginTop: 'var(--space-8)' }}>
            <Link href="/login" className="btn btn-primary">
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">📚</div>
          <span className="auth-logo-text">Lớp Học</span>
        </div>

        <h1 className="auth-title">Đăng ký tài khoản</h1>
        <p className="auth-subtitle">Tạo tài khoản mới để bắt đầu sử dụng.</p>

        {error && (
          <div className="auth-message auth-message-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="full_name" className="form-label">
              Họ và tên
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              placeholder="Nguyễn Văn A"
              className="form-input"
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="class_grade" className="form-label">
              Lớp
            </label>
            <input
              id="class_grade"
              name="class_grade"
              type="text"
              required
              placeholder="VD: 10A1, 11B2"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="date_of_birth" className="form-label">
              Ngày tháng năm sinh
            </label>
            <input
              id="date_of_birth"
              name="date_of_birth"
              type="date"
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="email@example.com"
              className="form-input"
              autoComplete="email"
            />
            <span className="form-hint">
              Email sẽ được dùng để đăng nhập và nhận liên kết xác minh.
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Mật khẩu
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="Tối thiểu 6 ký tự"
              className="form-input"
              autoComplete="new-password"
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span>
                Đang đăng ký...
              </>
            ) : (
              'Đăng ký'
            )}
          </button>
        </form>

        <div className="auth-footer">
          Đã có tài khoản?{' '}
          <Link href="/login">Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}
