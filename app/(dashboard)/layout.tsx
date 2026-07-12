'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { createClient } from '@/lib/supabase/client';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{
    full_name: string;
    role: string;
    class_grade: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient();
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
          router.push('/login');
          return;
        }

        // Try to fetch profile from database
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, role, class_grade')
          .eq('id', authUser.id)
          .single();

        if (profile) {
          setUser(profile);

          // Redirect admin to admin dashboard if on student dashboard
          if (profile.role === 'admin' && window.location.pathname === '/dashboard') {
            router.push('/admin');
          }
        } else {
          // Profile not found — likely migration not run or trigger didn't fire
          // Try to create the profile from auth metadata
          const meta = authUser.user_metadata || {};
          const fallbackProfile = {
            full_name: meta.full_name || authUser.email || 'User',
            role: meta.role || 'student',
            class_grade: meta.class_grade || '',
          };

          // Attempt to insert the profile
          const { error: insertError } = await supabase
            .from('profiles')
            .upsert({
              id: authUser.id,
              full_name: fallbackProfile.full_name,
              role: fallbackProfile.role,
              class_grade: fallbackProfile.class_grade,
              date_of_birth: meta.date_of_birth || null,
            });

          if (insertError) {
            console.error('Could not create profile:', insertError.message);
            console.warn('Using fallback profile from auth metadata');
          }

          setUser(fallbackProfile);
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
        setError('Không thể tải dữ liệu. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [router]);

  if (loading) {
    return (
      <div className="loading-overlay" style={{ minHeight: '100vh' }}>
        <div className="spinner spinner-lg"></div>
        <span>Đang tải...</span>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="loading-overlay" style={{ minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-4)' }}>⚠️</div>
          <h2 style={{ marginBottom: 'var(--space-2)' }}>Có lỗi xảy ra</h2>
          <p className="text-sm text-secondary" style={{ marginBottom: 'var(--space-4)', maxWidth: 400 }}>
            {error || 'Không tìm thấy hồ sơ. Hãy chắc chắn đã chạy migration SQL trong Supabase.'}
          </p>
          <div className="flex gap-4 justify-center">
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              🔄 Thử lại
            </button>
            <button className="btn btn-secondary" onClick={() => router.push('/login')}>
              Đăng nhập lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* Mobile header */}
      <div className="mobile-header">
        <button
          className="mobile-menu-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? '✕' : '☰'}
        </button>
        <span className="sidebar-brand-name" style={{ fontSize: 'var(--font-size-lg)' }}>
          📚 Lớp Học
        </span>
        <div style={{ width: 40 }}></div>
      </div>

      {/* Sidebar overlay for mobile */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar user={user} onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Main content */}
      <main className="dashboard-main">
        {children}
      </main>
    </div>
  );
}
