// Word 文档解析器 (DOCX)

import mammoth from 'mammoth';
import path from 'path';
import type { ParsedDocument, DocumentMetadata } from '@/types';

export async function parseDocx(filePath: string): Promise<ParsedDocument> {
  const result = await mammoth.extractRawText({ path: filePath });
  const content = result.value.trim();
  
  const metadata: DocumentMetadata = {
    wordCount: content.split(/\s+/).filter(Boolean).length,
  };

  // 从文件名提取标题
  const title = path.basename(filePath, path.extname(filePath));

  return {
    title,
    content,
    metadata,
  };
}

// 提取带格式的 HTML（可选，用于预览）
export async function parseDocxWithFormatting(filePath: string): Promise<{
  html: string;
  text: string;
  messages: string[];
}> {
  const [htmlResult, textResult] = await Promise.all([
    mammoth.convertToHtml({ path: filePath }),
    mammoth.extractRawText({ path: filePath }),
  ]);

  return {
    html: htmlResult.value,
    text: textResult.value,
    messages: htmlResult.messages.map(m => m.message),
  };
}
