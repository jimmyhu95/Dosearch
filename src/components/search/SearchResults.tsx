'use client';

import Link from 'next/link';
import { FileText, Calendar, HardDrive, Tag } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge, FileTypeBadge } from '@/components/ui/Badge';
import { formatRelativeTime, formatFileSize } from '@/lib/utils';
import type { SearchResult } from '@/types';

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  total: number;
  processingTime: number;
}

export function SearchResults({ results, query, total, processingTime }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">未找到相关文档</h3>
        <p className="text-gray-500 mb-4">
          没有找到与 &quot;{query}&quot; 相关的文档
        </p>
        <p className="text-sm text-gray-400">
          尝试使用不同的关键词或检查拼写
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* 搜索统计 */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          找到 <span className="font-medium text-gray-900">{total}</span> 个结果
          <span className="mx-2">·</span>
          用时 {processingTime}ms
        </p>
      </div>

      {/* 结果列表 */}
      <div className="space-y-4">
        {results.map((result) => (
          <SearchResultCard key={result.document.id} result={result} />
        ))}
      </div>
    </div>
  );
}

function SearchResultCard({ result }: { result: SearchResult }) {
  const { document, highlights } = result;
  
  // 获取高亮的内容片段
  const contentHighlight = highlights.find(h => h.field === 'content');
  const titleHighlight = highlights.find(h => h.field === 'title');

  return (
    <Card hover className="p-5">
      <Link href={`/doc/${document.id}`} className="block">
        <div className="flex items-start gap-4">
          {/* 文件类型图标 */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-gray-500" />
            </div>
          </div>

          {/* 内容 */}
          <div className="flex-1 min-w-0">
            {/* 标题 */}
            <h3 className="text-lg font-medium text-gray-900 mb-1 truncate">
              {titleHighlight ? (
                <span dangerouslySetInnerHTML={{ __html: titleHighlight.snippet }} />
              ) : (
                document.title
              )}
            </h3>

            {/* 摘要/高亮内容 */}
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {contentHighlight ? (
                <span dangerouslySetInnerHTML={{ __html: contentHighlight.snippet }} />
              ) : (
                document.summary || '暂无摘要'
              )}
            </p>

            {/* 元信息 */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
              <FileTypeBadge type={document.fileType} />
              
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatRelativeTime(document.createdAt)}
              </span>
              
              <span className="flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5" />
                {formatFileSize(document.fileSize)}
              </span>
            </div>

            {/* 分类标签 */}
            {document.categories && document.categories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Tag className="w-3.5 h-3.5 text-gray-400" />
                {document.categories.slice(0, 3).map((cat) => (
                  <Badge key={cat.categoryId} variant="outline" size="sm">
                    {cat.categoryName}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* 相关度分数 */}
          <div className="flex-shrink-0 text-right">
            <div className="text-xs text-gray-400">相关度</div>
            <div className="text-sm font-medium text-blue-600">
              {Math.round(result.score * 100)}%
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
}
