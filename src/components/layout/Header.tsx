'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, FolderOpen, Settings, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: '搜索', icon: Search },
    { href: '/category', label: '分类浏览', icon: FolderOpen },
    { href: '/admin', label: '管理', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#f8f7f4]/80 backdrop-blur-md pb-[-1px]">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-zinc-900 rounded-[12px] shadow-md flex items-center justify-center">
              <Search className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl text-zinc-900 tracking-tight">Dosearch</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300',
                    isActive
                      ? 'bg-black/5 text-zinc-900 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-black/5'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Stats Button */}
          <Link
            href="/admin"
            className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-black/5 rounded-full transition-all duration-300"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">统计</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
