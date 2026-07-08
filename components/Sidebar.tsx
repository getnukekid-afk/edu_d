'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from '@/app/actions/auth';

interface SidebarProps {
  user: {
    full_name: string;
    role: string;
    class_grade?: string;
  };
  onClose?: () => void;
}

export default function Sidebar({ user, onClose }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(path);
  };

  return (
    <>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">📚</div>
          <span className="sidebar-brand-name">Lớp Học</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {user.role === 'admin' ? (
          <>
            <div className="sidebar-section-title">Quản lý</div>
            <Link
              href="/admin"
              className={`sidebar-link ${isActive('/admin') && pathname === '/admin' ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="sidebar-link-icon">📊</span>
              Tổng quan
            </Link>
            <Link
              href="/admin/assignments"
              className={`sidebar-link ${isActive('/admin/assignments') ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="sidebar-link-icon">📝</span>
              Bài tập
            </Link>
          </>
        ) : (
          <>
            <div className="sidebar-section-title">Học tập</div>
            <Link
              href="/dashboard"
              className={`sidebar-link ${isActive('/dashboard') && !pathname.startsWith('/dashboard/') ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="sidebar-link-icon">🏠</span>
              Trang chủ
            </Link>
            <Link
              href="/dashboard"
              className={`sidebar-link ${pathname.startsWith('/assignments') ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="sidebar-link-icon">📋</span>
              Bài tập
            </Link>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user.full_name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.full_name}</div>
            <div className="sidebar-user-role">
              {user.role === 'admin' ? 'Giáo viên' : `Học sinh${user.class_grade ? ` • ${user.class_grade}` : ''}`}
            </div>
          </div>
        </div>
        <form action={signOut} style={{ marginTop: 'var(--space-3)' }}>
          <button type="submit" className="btn btn-ghost btn-sm w-full">
            🚪 Đăng xuất
          </button>
        </form>
      </div>
    </>
  );
}
