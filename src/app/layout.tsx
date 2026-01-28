import type { Metadata } from "next";
import { Nunito, Poppins, Noto_Sans_SC } from "next/font/google";
import "./globals.css";

const displayFont = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const bodyFont = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

const cnFont = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cn",
});

export const metadata: Metadata = {
  title: "上岸助手 | 面向大学生的求职入口",
  description:
    "上岸助手为大学生提供简洁可信的求职入口，邀请码注册后即可查看精选招聘表格。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${displayFont.variable} ${bodyFont.variable} ${cnFont.variable}`}>
        {children}
      </body>
    </html>
  );
}
