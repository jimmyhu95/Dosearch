'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { debounce } from '@/lib/utils';

interface SearchBarProps {
  initialValue?: string;
  placeholder?: string;
  autoFocus?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onSearch?: (query: string) => void;
  showSuggestions?: boolean;
  className?: string;
}

export function SearchBar({
  initialValue = '',
  placeholder = '搜索文档...',
  autoFocus = false,
  size = 'md',
  onSearch,
  showSuggestions = true,
  className,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const sizeStyles = {
    sm: 'h-10 text-sm',
    md: 'h-12 text-base',
    lg: 'h-14 text-lg',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  // 获取搜索建议
  const fetchSuggestions = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery || searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (showSuggestions) {
      fetchSuggestions(value);
      setShowDropdown(true);
    }
  };

  // 处理搜索提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowDropdown(false);
      if (onSearch) {
        onSearch(query.trim());
      } else {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  // 处理建议点击
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowDropdown(false);
    if (onSearch) {
      onSearch(suggestion);
    } else {
      router.push(`/search?q=${encodeURIComponent(suggestion)}`);
    }
  };

  // 清除输入
  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn('relative', className)}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {isLoading ? (
              <Loader2 className={cn('text-gray-400 animate-spin', iconSizes[size])} />
            ) : (
              <Search className={cn('text-gray-400', iconSizes[size])} />
            )}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className={cn(
              'w-full rounded-full border border-black/5 bg-white shadow-[0_2px_10px_rgb(0,0,0,0.02)] pl-12 pr-20 text-gray-900',
              'placeholder:text-gray-400',
              'focus:ring-2 focus:ring-zinc-900/10 focus:outline-none',
              'transition-all duration-300',
              sizeStyles[size]
            )}
          />

          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-20 flex items-center px-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className={iconSizes[size]} />
            </button>
          )}

          <button
            type="submit"
            className={cn(
              'absolute inset-y-1 right-1 flex items-center px-4 rounded-full',
              'bg-zinc-900 text-white hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-zinc-900 shadow-sm',
              'text-sm font-medium'
            )}
          >
            搜索
          </button>
        </div>
      </form>

      {/* 搜索建议下拉框 */}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-3 bg-white/90 backdrop-blur-md rounded-3xl border border-black/5 shadow-[0_12px_40px_rgb(0,0,0,0.08)] z-50 overflow-hidden"
        >
          <ul className="py-2">
            {suggestions.map((suggestion, index) => (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <Search className="w-4 h-4 text-gray-400" />
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
