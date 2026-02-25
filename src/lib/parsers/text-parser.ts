// 纯文本文件解析器

import fs from 'fs/promises';
import path from 'path';
import type { ParsedDocument, DocumentMetadata } from '@/types';

// 支持的文本文件编码检测
async function readTextFile(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  
  // 尝试检测 BOM 并选择正确的编码
  if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    // UTF-8 with BOM
    return buffer.toString('utf8').slice(1);
  } else if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
    // UTF-16 LE
    return buffer.toString('utf16le').slice(1);
  } else if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
    // UTF-16 BE
    return buffer.swap16().toString('utf16le').slice(1);
  }
  
  // 默认使用 UTF-8
  return buffer.toString('utf8');
}

export async function parseText(filePath: string): Promise<ParsedDocument> {
  const content = await readTextFile(filePath);
  
  // 统计行数和字数
  const lines = content.split('\n');
  const words = content.split(/\s+/).filter(Boolean);
  
  const metadata: DocumentMetadata = {
    wordCount: words.length,
  };

  // 从文件名提取标题
  const title = path.basename(filePath, path.extname(filePath));

  return {
    title,
    content: content.trim(),
    metadata,
  };
}

// 判断是否为文本文件
export function isTextFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  const textExtensions = [
    '.txt', '.md', '.markdown', '.rst', '.log',
    '.json', '.xml', '.yaml', '.yml', '.toml',
    '.ini', '.cfg', '.conf', '.env',
    '.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs',
    '.py', '.rb', '.go', '.rs', '.java', '.c', '.cpp', '.h', '.hpp',
    '.css', '.scss', '.sass', '.less',
    '.html', '.htm', '.vue', '.svelte',
    '.sql', '.sh', '.bash', '.zsh', '.fish',
    '.gitignore', '.dockerignore', '.editorconfig',
  ];
  
  return textExtensions.includes(ext);
}
