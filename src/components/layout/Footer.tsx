import Link from 'next/link';
import { Github, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Dosearch - 本地文档分析与搜索系统</span>
          </div>

          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              管理面板
            </Link>
            <Link
              href="/admin/settings"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              系统配置
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Made By Jimmy
          </p>
        </div>
      </div>
    </footer>
  );
}
