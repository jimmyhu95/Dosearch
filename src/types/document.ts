// 文档类型定义

export type FileType = 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'txt' | 'image' | 'ofd';

export interface DocumentMetadata {
  author?: string;
  createdDate?: string;
  modifiedDate?: string;
  pageCount?: number;
  wordCount?: number;
  sheetCount?: number;
  slideCount?: number;
  [key: string]: unknown;
}

export interface Document {
  id: string;
  title: string;
  filePath: string;
  fileType: FileType;
  fileSize: number;
  content: string | null;
  summary: string | null;
  createdAt: Date;
  modifiedAt: Date | null;
  indexedAt: Date | null;
  fileHash: string;
  metadata: DocumentMetadata | null;
}

export interface DocumentWithCategories extends Document {
  categories: CategoryAssignment[];
  keywords: Keyword[];
}

export interface CategoryAssignment {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  confidence: number;
}

export interface Keyword {
  id: string;
  keyword: string;
  weight: number;
}

export interface ParsedDocument {
  title: string;
  content: string;
  metadata: DocumentMetadata;
}

export interface DocumentCreateInput {
  title: string;
  filePath: string;
  fileType: FileType;
  fileSize: number;
  content?: string;
  summary?: string;
  fileHash: string;
  metadata?: DocumentMetadata;
}

export interface DocumentUpdateInput {
  title?: string;
  content?: string;
  summary?: string;
  fileHash?: string;
  metadata?: DocumentMetadata;
}
