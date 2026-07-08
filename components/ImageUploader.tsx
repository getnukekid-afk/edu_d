'use client';

import { useState, useRef, useCallback } from 'react';

interface ImageUploaderProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
  currentImageUrl?: string | null;
}

export default function ImageUploader({ onFileSelected, disabled, currentImageUrl }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Chỉ chấp nhận file hình ảnh (JPEG, PNG)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File không được vượt quá 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    onFileSelected(file);
  }, [onFileSelected]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const removePreview = () => {
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  if (preview) {
    return (
      <div className="upload-preview">
        <img src={preview} alt="Bài tập đã tải lên" />
        {!disabled && (
          <button
            type="button"
            onClick={removePreview}
            className="upload-preview-remove"
            aria-label="Xóa ảnh"
          >
            ✕
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div
        className={`upload-zone ${isDragOver ? 'drag-over' : ''}`}
        onClick={() => !disabled && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        role="button"
        tabIndex={0}
        aria-label="Kéo thả hoặc nhấn để tải ảnh bài tập"
      >
        <div className="upload-zone-icon">📷</div>
        <div className="upload-zone-text">
          <strong>Kéo thả</strong> ảnh bài tập vào đây hoặc <strong>nhấn để chọn</strong>
        </div>
        <div className="upload-zone-hint">
          Chấp nhận JPEG, PNG — Tối đa 10MB
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleInputChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />
    </>
  );
}
