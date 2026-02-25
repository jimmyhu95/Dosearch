import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Dosearch - 本地文档分析与搜索系统',
    template: '%s | Dosearch',
  },
  description: '一个强大的本地文档分析与搜索系统，支持 PDF、Word、Excel、PPT 等多种格式，提供智能分类和语义搜索功能。',
  keywords: ['文档搜索', '本地搜索', 'PDF搜索', '文档管理', '智能分类', '语义搜索'],
  authors: [{ name: 'Dosearch' }],
  openGraph: {
    title: 'Dosearch - 本地文档分析与搜索系统',
    description: '一个强大的本地文档分析与搜索系统，支持多种文档格式，提供智能分类和语义搜索功能。',
    type: 'website',
    locale: 'zh_CN',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </body>
    </html>
  );
}
