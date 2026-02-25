'use client';

import { Calendar, HardDrive, FileText, FolderOpen, Hash, Clock } from 'lucide-react';
import { Badge, FileTypeBadge } from '@/components/ui/Badge';
import { formatDate, formatFileSize } from '@/lib/utils';
import type { DocumentWithCategories } from '@/types';

interface DocumentMetaProps {
  document: DocumentWithCategories;
}

export function DocumentMeta({ document }: DocumentMetaProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">文档信息</h3>
      
      <dl className="space-y-4">
        {/* 文件类型 */}
        <div className="flex items-center justify-between">
          <dt className="flex items-center gap-2 text-sm text-gray-500">
            <FileText className="w-4 h-4" />
            文件类型
          </dt>
          <dd>
            <FileTypeBadge type={document.fileType} />
          </dd>
        </div>

        {/* 文件大小 */}
        <div className="flex items-center justify-between">
          <dt className="flex items-center gap-2 text-sm text-gray-500">
            <HardDrive className="w-4 h-4" />
            文件大小
          </dt>
          <dd className="text-sm font-medium text-gray-900">
            {formatFileSize(document.fileSize)}
          </dd>
        </div>

        {/* 创建时间 */}
        <div className="flex items-center justify-between">
          <dt className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            创建时间
          </dt>
          <dd className="text-sm text-gray-900">
            {formatDate(document.createdAt)}
          </dd>
        </div>

        {/* 修改时间 */}
        {document.modifiedAt && (
          <div className="flex items-center justify-between">
            <dt className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              修改时间
            </dt>
            <dd className="text-sm text-gray-900">
              {formatDate(document.modifiedAt)}
            </dd>
          </div>
        )}

        {/* 分类 */}
        {document.categories && document.categories.length > 0 && (
          <div>
            <dt className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <FolderOpen className="w-4 h-4" />
              所属分类
            </dt>
            <dd className="flex flex-wrap gap-1.5">
              {document.categories.map((cat) => (
                <Badge key={cat.categoryId} variant="primary" size="sm">
                  {cat.categoryName}
                </Badge>
              ))}
            </dd>
          </div>
        )}

        {/* 关键词 */}
        {document.keywords && document.keywords.length > 0 && (
          <div>
            <dt className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Hash className="w-4 h-4" />
              关键词
            </dt>
            <dd className="flex flex-wrap gap-1.5">
              {document.keywords.slice(0, 10).map((kw) => (
                <Badge key={kw.id} variant="outline" size="sm">
                  {kw.keyword}
                </Badge>
              ))}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
