// Excel 文档解析器 (XLSX)

import * as XLSX from 'xlsx';
import path from 'path';
import type { ParsedDocument, DocumentMetadata } from '@/types';

export async function parseXlsx(filePath: string): Promise<ParsedDocument> {
  const workbook = XLSX.readFile(filePath);
  
  const sheetNames = workbook.SheetNames;
  const contentParts: string[] = [];
  
  // 遍历所有工作表
  for (const sheetName of sheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    
    // 转换为文本
    const text = XLSX.utils.sheet_to_txt(worksheet, { blankrows: false });
    
    if (text.trim()) {
      contentParts.push(`[${sheetName}]\n${text}`);
    }
  }
  
  const content = contentParts.join('\n\n');
  
  const metadata: DocumentMetadata = {
    sheetCount: sheetNames.length,
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

// 获取工作表数据为 JSON 格式（用于预览）
export function getSheetData(filePath: string): Record<string, unknown[][]> {
  const workbook = XLSX.readFile(filePath);
  const result: Record<string, unknown[][]> = {};
  
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    result[sheetName] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  }
  
  return result;
}
