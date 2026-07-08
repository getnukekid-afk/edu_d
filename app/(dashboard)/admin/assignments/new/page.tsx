'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ImageUploader from '@/components/ImageUploader';

export default function NewAssignmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answerKeyFile, setAnswerKeyFile] = useState<File | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const answerKey = formData.get('answer_key') as string;
    const dueDate = formData.get('due_date') as string;

    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Chưa đăng nhập');

      let answerKeyImageUrl: string | null = null;

      // Upload answer key image if provided
      if (answerKeyFile) {
        const fileName = `${user.id}/${Date.now()}_answer.${answerKeyFile.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage
          .from('answer-keys')
          .upload(fileName, answerKeyFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('answer-keys')
          .getPublicUrl(fileName);

        answerKeyImageUrl = publicUrl;
      }

      const { error: insertError } = await supabase
        .from('assignments')
        .insert({
          created_by: user.id,
          title,
          description,
          answer_key: answerKey,
          answer_key_image_url: answerKeyImageUrl,
          due_date: dueDate || null,
        });

      if (insertError) throw insertError;

      router.push('/admin/assignments');

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <button
        className="btn btn-ghost mb-6"
        onClick={() => router.push('/admin/assignments')}
      >
        ← Quay lại
      </button>

      <div className="page-header">
        <h1 className="page-title">➕ Tạo bài tập mới</h1>
        <p className="page-subtitle">Tạo bài tập và đáp án để hệ thống AI chấm điểm tự động</p>
      </div>

      <div className="card" style={{ maxWidth: 680 }}>
        {error && (
          <div className="auth-message auth-message-error mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Tiêu đề bài tập *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              placeholder="VD: Bài tập Toán chương 3"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Mô tả / Hướng dẫn *
            </label>
            <textarea
              id="description"
              name="description"
              required
              placeholder="Mô tả chi tiết yêu cầu bài tập, bao gồm các bài cần làm..."
              className="form-textarea"
              rows={4}
            />
          </div>

          <div className="form-group">
            <label htmlFor="answer_key" className="form-label">
              Đáp án (văn bản) *
            </label>
            <textarea
              id="answer_key"
              name="answer_key"
              required
              placeholder="Nhập đáp án hoặc tiêu chí chấm điểm. AI sẽ sử dụng thông tin này để so sánh và chấm bài..."
              className="form-textarea"
              rows={6}
            />
            <span className="form-hint">
              Đáp án càng chi tiết, AI chấm càng chính xác.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">
              Đáp án (hình ảnh) — Tùy chọn
            </label>
            <ImageUploader
              onFileSelected={setAnswerKeyFile}
              disabled={loading}
            />
            <span className="form-hint">
              Tải ảnh đáp án để AI có thêm thông tin đối chiếu.
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="due_date" className="form-label">
              Hạn nộp — Tùy chọn
            </label>
            <input
              id="due_date"
              name="due_date"
              type="datetime-local"
              className="form-input"
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
                Đang tạo...
              </>
            ) : (
              '📝 Tạo bài tập'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
