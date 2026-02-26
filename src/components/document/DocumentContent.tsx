'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

import { HighlightText } from '@/components/ui/HighlightText';

interface DocumentContentProps {
  content: string | null;
  summary?: string | null;
  maxHeight?: number;
  keyword?: string;
}

export function DocumentContent({ content, summary, maxHeight = 500, keyword = '' }: DocumentContentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!content) {
    return (
      <div className="bg-gray-50 rounded-xl p-8 text-center">
        <p className="text-gray-500">暂无内容预览</p>
      </div>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const needsExpansion = content.length > 2000;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* 摘要 */}
      {summary && (
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
          <h4 className="text-sm font-medium text-blue-900 mb-2">摘要</h4>
          <p className="text-sm text-blue-800">
            <HighlightText text={summary} keyword={keyword} />
          </p>
        </div>
      )}

      {/* 内容区域 */}
      <div className="relative">
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="bg-white"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-1.5 text-green-600" />
                已复制
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1.5" />
                复制
              </>
            )}
          </Button>
        </div>

        <div
          className={cn(
            'p-6 overflow-hidden transition-all',
            !isExpanded && needsExpansion && 'max-h-[500px]'
          )}
          style={!isExpanded && needsExpansion ? { maxHeight } : undefined}
        >
          <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
            <HighlightText text={content} keyword={keyword} />
          </pre>
        </div>

        {/* 渐变遮罩 */}
        {needsExpansion && !isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        )}
      </div>

      {/* 展开/收起按钮 */}
      {needsExpansion && (
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1.5" />
                收起内容
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1.5" />
                展开全部内容
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
