'use client';

import Link from 'next/link';
import { FileText, Calendar, HardDrive, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge, FileTypeBadge } from '@/components/ui/Badge';
import { formatRelativeTime, formatFileSize, truncateText } from '@/lib/utils';
import type { DocumentWithCategories } from '@/types';

interface DocumentCardProps {
  document: DocumentWithCategories;
  showContent?: boolean;
}

export function DocumentCard({ document, showContent = true }: DocumentCardProps) {
  return (
    <Card hover className="overflow-hidden">
      <Link href={`/doc/${document.id}`} className="block p-5">
        <div className="flex items-start gap-4">
          {/* 文件类型图标 */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center border border-gray-200">
              <FileText className="w-6 h-6 text-gray-500" />
            </div>
          </div>

          {/* 内容 */}
          <div className="flex-1 min-w-0">
            {/* 标题 */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-base font-semibold text-gray-900 truncate">
                {document.title}
              </h3>
              <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </div>

            {/* 摘要 */}
            {showContent && document?.summary && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {truncateText(document.summary, 150)}
              </p>
            )}

            {/* 元信息 */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <FileTypeBadge type={document?.fileType} />

              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {document?.createdAt ? formatRelativeTime(document.createdAt) : '未知时间'}
              </span>

              <span className="flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5" />
                {document?.fileSize ? formatFileSize(document.fileSize) : '未知大小'}
              </span>
            </div>

            {/* 分类标签 */}
            {document?.categories && document.categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {document.categories.slice(0, 3).map((cat) => (
                  <Badge key={cat?.categoryId || Math.random().toString()} variant="default" size="sm">
                    {cat?.categoryName || '未知分类'}
                  </Badge>
                ))}
                {document.categories.length > 3 && (
                  <Badge variant="outline" size="sm">
                    +{document.categories.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    </Card>
  );
}

// 紧凑版文档卡片
export function DocumentCardCompact({ document }: { document: DocumentWithCategories }) {
  if (!document) return null;
  return (
    <Link
      href={`/doc/${document.id}`}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
        <FileText className="w-4 h-4 text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 truncate">{document?.title || '未命名文档'}</h4>
        <p className="text-xs text-gray-500">
          {document?.createdAt ? formatRelativeTime(document.createdAt) : ''}
        </p>
      </div>
      {document?.fileType && <FileTypeBadge type={document.fileType} />}
    </Link>
  );
}
