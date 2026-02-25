'use client';

import { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface SearchFiltersProps {
  categories: FilterOption[];
  fileTypes: FilterOption[];
  selectedCategories: string[];
  selectedFileTypes: string[];
  dateRange?: { from?: string; to?: string };
  onCategoriesChange: (categories: string[]) => void;
  onFileTypesChange: (fileTypes: string[]) => void;
  onDateRangeChange: (range: { from?: string; to?: string }) => void;
  onClear: () => void;
}

export function SearchFilters({
  categories,
  fileTypes,
  selectedCategories,
  selectedFileTypes,
  dateRange,
  onCategoriesChange,
  onFileTypesChange,
  onDateRangeChange,
  onClear,
}: SearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedFileTypes.length > 0 ||
    dateRange?.from ||
    dateRange?.to;

  const toggleCategory = (value: string) => {
    if (selectedCategories.includes(value)) {
      onCategoriesChange(selectedCategories.filter(c => c !== value));
    } else {
      onCategoriesChange([...selectedCategories, value]);
    }
  };

  const toggleFileType = (value: string) => {
    if (selectedFileTypes.includes(value)) {
      onFileTypesChange(selectedFileTypes.filter(t => t !== value));
    } else {
      onFileTypesChange([...selectedFileTypes, value]);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* 筛选器头部 */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-gray-700">筛选条件</span>
          {hasActiveFilters && (
            <Badge variant="primary" size="sm">
              {selectedCategories.length + selectedFileTypes.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4 mr-1" />
              清除
            </Button>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* 筛选器内容 */}
      {isExpanded && (
        <div className="px-4 py-4 border-t border-gray-100 space-y-6">
          {/* 文件类型 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">文件类型</h4>
            <div className="flex flex-wrap gap-2">
              {fileTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => toggleFileType(type.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    selectedFileTypes.includes(type.value)
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200'
                  )}
                >
                  {type.label}
                  {type.count !== undefined && (
                    <span className="ml-1.5 text-xs opacity-70">({type.count})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 分类 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">文档分类</h4>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => toggleCategory(cat.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    selectedCategories.includes(cat.value)
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200'
                  )}
                >
                  {cat.label}
                  {cat.count !== undefined && (
                    <span className="ml-1.5 text-xs opacity-70">({cat.count})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 日期范围 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">时间范围</h4>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={dateRange?.from || ''}
                onChange={(e) => onDateRangeChange({ ...dateRange, from: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-gray-400">至</span>
              <input
                type="date"
                value={dateRange?.to || ''}
                onChange={(e) => onDateRangeChange({ ...dateRange, to: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
