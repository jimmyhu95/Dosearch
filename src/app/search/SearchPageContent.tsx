'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SearchBar } from '@/components/search/SearchBar';
import { SearchResults } from '@/components/search/SearchResults';
import { SearchFilters } from '@/components/search/SearchFilters';
import { Pagination } from '@/components/search/Pagination';
import { DocumentCardSkeleton } from '@/components/ui/Loading';
import type { SearchResponse, CategoryWithCount } from '@/types';

export function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1');

  const [results, setResults] = useState<SearchResponse | null>(null);
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFileTypes, setSelectedFileTypes] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});

  // 获取分类列表
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCategories(data.data);
        }
      })
      .catch(console.error);
  }, []);

  // 执行搜索
  const performSearch = useCallback(async () => {
    if (!query) return;

    setIsLoading(true);

    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
      limit: '20',
    });

    if (selectedCategories.length > 0) {
      params.set('categories', selectedCategories.join(','));
    }
    if (selectedFileTypes.length > 0) {
      params.set('fileTypes', selectedFileTypes.join(','));
    }
    if (dateRange.from) {
      params.set('dateFrom', dateRange.from);
    }
    if (dateRange.to) {
      params.set('dateTo', dateRange.to);
    }

    try {
      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();

      if (data.success) {
        setResults(data.data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [query, page, selectedCategories, selectedFileTypes, dateRange]);

  // 监听搜索参数变化
  useEffect(() => {
    performSearch();
  }, [performSearch]);

  // 处理搜索
  const handleSearch = (newQuery: string) => {
    router.push(`/search?q=${encodeURIComponent(newQuery)}`);
  };

  // 处理分页
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/search?${params}`);
  };

  // 清除筛选
  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSelectedFileTypes([]);
    setDateRange({});
  };

  const fileTypeOptions = [
    { value: 'pdf', label: 'PDF' },
    { value: 'docx', label: 'Word' },
    { value: 'xlsx', label: 'Excel' },
    { value: 'pptx', label: 'PPT' },
    { value: 'txt', label: '文本' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* 搜索栏 */}
        <div className="max-w-3xl mx-auto mb-8">
          <SearchBar
            initialValue={query}
            onSearch={handleSearch}
            size="md"
          />
        </div>

        {query && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* 筛选器侧边栏 */}
            <aside className="lg:col-span-1">
              <SearchFilters
                categories={categories.map(c => ({
                  value: c.slug,
                  label: c.name,
                  count: c.documentCount,
                }))}
                fileTypes={fileTypeOptions}
                selectedCategories={selectedCategories}
                selectedFileTypes={selectedFileTypes}
                dateRange={dateRange}
                onCategoriesChange={setSelectedCategories}
                onFileTypesChange={setSelectedFileTypes}
                onDateRangeChange={setDateRange}
                onClear={handleClearFilters}
              />
            </aside>

            {/* 搜索结果 */}
            <div className="lg:col-span-3">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <DocumentCardSkeleton key={i} />
                  ))}
                </div>
              ) : results ? (
                <>
                  <SearchResults
                    results={results.results}
                    query={query}
                    total={results.total}
                    processingTime={results.processingTime}
                  />

                  {results.totalPages > 1 && (
                    <div className="mt-8">
                      <Pagination
                        currentPage={results.page}
                        totalPages={results.totalPages}
                        onPageChange={handlePageChange}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16 text-gray-500">
                  输入关键词开始搜索
                </div>
              )}
            </div>
          </div>
        )}

        {!query && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-xl font-medium text-gray-900 mb-2">开始搜索</h2>
            <p className="text-gray-500">在上方输入关键词搜索您的文档</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
