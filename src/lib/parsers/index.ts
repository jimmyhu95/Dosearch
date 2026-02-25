// 文档解析器统一入口

import path from 'path';
import type { ParsedDocument, FileType } from '@/types';
import { parsePdf } from './pdf-parser';
import { parseDocx } from './docx-parser';
import { parseXlsx } from './xlsx-parser';
import { parsePptx } from './pptx-parser';
import { parseText, isTextFile } from './text-parser';
import { parseImage } from './image-parser';

// 文件类型映射
const FILE_TYPE_MAP: Record<string, FileType> = {
  '.pdf': 'pdf',
  '.docx': 'docx',
  '.doc': 'docx',
  '.xlsx': 'xlsx',
  '.xls': 'xlsx',
  '.pptx': 'pptx',
  '.ppt': 'pptx',
  '.txt': 'txt',
  '.png': 'image',
  '.jpg': 'image',
  '.jpeg': 'image',
  '.gif': 'image',
  '.webp': 'image',
};

// 支持的文件扩展名
export const SUPPORTED_EXTENSIONS = [
  '.pdf', '.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt', '.txt',
  '.png', '.jpg', '.jpeg', '.gif', '.webp',
];

/**
 * 获取文件类型
 */
export function getFileType(filePath: string): FileType | null {
  const ext = path.extname(filePath).toLowerCase();

  if (FILE_TYPE_MAP[ext]) {
    return FILE_TYPE_MAP[ext];
  }

  // 检查是否为文本文件
  if (isTextFile(filePath)) {
    return 'txt';
  }

  return null;
}

/**
 * 检查文件是否支持解析
 */
export function isSupportedFile(filePath: string): boolean {
  return getFileType(filePath) !== null;
}

/**
 * 解析文档
 */
export async function parseDocument(filePath: string): Promise<ParsedDocument> {
  const fileType = getFileType(filePath);

  if (!fileType) {
    throw new Error(`Unsupported file type: ${path.extname(filePath)}`);
  }

  switch (fileType) {
    case 'pdf':
      return parsePdf(filePath);
    case 'docx':
      return parseDocx(filePath);
    case 'xlsx':
      return parseXlsx(filePath);
    case 'pptx':
      return parsePptx(filePath);
    case 'txt':
      return parseText(filePath);
    case 'image':
      return parseImage(filePath);
    default:
      throw new Error(`Unknown file type: ${fileType}`);
  }
}

/**
 * 批量解析文档
 */
export async function parseDocuments(
  filePaths: string[],
  onProgress?: (current: number, total: number, filePath: string) => void
): Promise<Map<string, ParsedDocument | Error>> {
  const results = new Map<string, ParsedDocument | Error>();

  for (let i = 0; i < filePaths.length; i++) {
    const filePath = filePaths[i];

    if (onProgress) {
      onProgress(i + 1, filePaths.length, filePath);
    }

    try {
      const parsed = await parseDocument(filePath);
      results.set(filePath, parsed);
    } catch (error) {
      results.set(filePath, error instanceof Error ? error : new Error(String(error)));
    }
  }

  return results;
}

// 导出各个解析器
export { parsePdf } from './pdf-parser';
export { parseDocx, parseDocxWithFormatting } from './docx-parser';
export { parseXlsx, getSheetData } from './xlsx-parser';
export { parsePptx } from './pptx-parser';
export { parseText, isTextFile } from './text-parser';
export { parseImage } from './image-parser';
