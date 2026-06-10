import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "키자니아 대중음악 연구소 | 어린이 직업체험",
  description: "어린이 직업체험 테마파크 키자니아의 대중음악 연구소! 나만의 노래를 작사, 작곡하고 앨범을 발매하여 빌보드 차트에 도전해 보세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-gray-950 text-slate-100 selection:bg-yellow-500 selection:text-gray-950">
        {children}
      </body>
    </html>
  );
}
