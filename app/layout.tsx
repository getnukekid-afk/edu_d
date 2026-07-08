import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lớp Học — Hệ thống quản lý lớp học",
  description: "Nền tảng quản lý bài tập và chấm điểm tự động bằng AI cho học sinh và giáo viên.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
