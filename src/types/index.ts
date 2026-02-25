// 类型导出入口

export * from './document';
export * from './category';
export * from './search';

// 通用类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ScanConfig {
  paths: string[];
  recursive: boolean;
  includeHidden: boolean;
  fileTypes: string[];
  excludePatterns: string[];
}

export interface ScanHistory {
  id: string;
  scanPath: string;
  startedAt: Date;
  completedAt: Date | null;
  totalFiles: number;
  processedFiles: number;
  newFiles: number;
  updatedFiles: number;
  status: 'running' | 'completed' | 'failed';
}

export interface SystemStats {
  totalDocuments: number;
  totalCategories: number;
  totalKeywords: number;
  storageUsed: number;
  lastScanAt: Date | null;
  documentsByType: Record<string, number>;
  documentsByCategory: Record<string, number>;
}
