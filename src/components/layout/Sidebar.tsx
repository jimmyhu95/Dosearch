'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Search, FolderOpen, Settings, FileText,
  Code, Briefcase, GraduationCap, Scale, DollarSign,
  Package, Users, BookOpen, File
} from 'lucide-react';
import { cn } from '@/lib/utils';

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'technology': Code,
  'business': Briefcase,
  'academic': GraduationCap,
  'legal': Scale,
  'finance': DollarSign,
  'product': Package,
  'meeting': Users,
  'training': BookOpen,
  'other': File,
};

interface SidebarProps {
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
    count: number;
  }>;
}

export function Sidebar({ categories = [] }: SidebarProps) {
  const pathname = usePathname();

  const mainNavItems = [
    { href: '/', label: '首页', icon: Home },
    { href: '/search', label: '搜索', icon: Search },
  ];

  return (
    <aside className="w-64 h-screen sticky top-0 border-r border-gray-200 bg-white overflow-y-auto">
      <div className="p-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900">Dosearch</h1>
            <p className="text-xs text-gray-500">本地文档搜索</p>
          </div>
        </Link>

        {/* Main Navigation */}
        <nav className="space-y-1 mb-8">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Categories */}
        {categories.length > 0 && (
          <div>
            <h2 className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              文档分类
            </h2>
            <nav className="space-y-1">
              {categories.map((category) => {
                const Icon = categoryIcons[category.slug] || FolderOpen;
                const isActive = pathname === `/category/${category.slug}`;

                return (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{category.name}</span>
                    </div>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      isActive ? 'bg-blue-100' : 'bg-gray-100'
                    )}>
                      {category.count}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {/* Admin Link */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <Link
            href="/admin"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              pathname.startsWith('/admin')
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            )}
          >
            <Settings className="w-5 h-5" />
            管理设置
          </Link>
        </div>
      </div>
    </aside>
  );
}
