// MeiliSearch 客户端配置

import { MeiliSearch, Index } from 'meilisearch';

const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST || 'http://localhost:7700';
const MEILISEARCH_API_KEY = process.env.MEILISEARCH_API_KEY || '';

// MeiliSearch 客户端实例
let client: MeiliSearch | null = null;

/**
 * 获取 MeiliSearch 客户端
 */
export function getMeiliClient(): MeiliSearch {
  if (!client) {
    client = new MeiliSearch({
      host: MEILISEARCH_HOST,
      apiKey: MEILISEARCH_API_KEY,
    });
  }
  return client;
}

// 索引名称
export const DOCUMENTS_INDEX = 'documents';

// 文档索引的数据结构
export interface MeiliDocument {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  fileType: string;
  filePath: string;
  categories: string[];
  categoryNames: string[];
  keywords: string[];
  createdAt: number;
  modifiedAt: number | null;
  fileSize: number;
}

/**
 * 初始化文档索引
 */
export async function initializeIndex(): Promise<Index<MeiliDocument>> {
  const client = getMeiliClient();
  
  // 创建或获取索引
  try {
    await client.createIndex(DOCUMENTS_INDEX, { primaryKey: 'id' });
  } catch {
    // 索引可能已存在，忽略错误
  }
  
  const index = client.index<MeiliDocument>(DOCUMENTS_INDEX);
  
  // 配置索引设置
  await index.updateSettings({
    // 可搜索的属性
    searchableAttributes: [
      'title',
      'content',
      'summary',
      'keywords',
      'categoryNames',
    ],
    // 可过滤的属性
    filterableAttributes: [
      'fileType',
      'categories',
      'createdAt',
      'modifiedAt',
    ],
    // 可排序的属性
    sortableAttributes: [
      'createdAt',
      'modifiedAt',
      'title',
      'fileSize',
    ],
    // 显示的属性
    displayedAttributes: [
      'id',
      'title',
      'summary',
      'fileType',
      'filePath',
      'categories',
      'categoryNames',
      'keywords',
      'createdAt',
      'modifiedAt',
      'fileSize',
    ],
    // 分词器设置（支持中文）
    pagination: {
      maxTotalHits: 10000,
    },
    // typo tolerance
    typoTolerance: {
      enabled: true,
      minWordSizeForTypos: {
        oneTypo: 4,
        twoTypos: 8,
      },
    },
  });
  
  return index;
}

/**
 * 获取文档索引
 */
export async function getDocumentsIndex(): Promise<Index<MeiliDocument>> {
  const client = getMeiliClient();
  return client.index<MeiliDocument>(DOCUMENTS_INDEX);
}

/**
 * 添加或更新文档到索引
 */
export async function indexDocument(doc: MeiliDocument): Promise<void> {
  const index = await getDocumentsIndex();
  await index.addDocuments([doc]);
}

/**
 * 批量添加文档到索引
 */
export async function indexDocuments(docs: MeiliDocument[]): Promise<void> {
  const index = await getDocumentsIndex();
  await index.addDocuments(docs);
}

/**
 * 从索引中删除文档
 */
export async function removeFromIndex(documentId: string): Promise<void> {
  const index = await getDocumentsIndex();
  await index.deleteDocument(documentId);
}

/**
 * 全文搜索
 */
export async function searchDocuments(
  query: string,
  options: {
    filter?: string;
    sort?: string[];
    limit?: number;
    offset?: number;
    attributesToHighlight?: string[];
  } = {}
) {
  const index = await getDocumentsIndex();
  
  return index.search(query, {
    filter: options.filter,
    sort: options.sort,
    limit: options.limit || 20,
    offset: options.offset || 0,
    attributesToHighlight: options.attributesToHighlight || ['title', 'content', 'summary'],
    highlightPreTag: '<mark>',
    highlightPostTag: '</mark>',
    attributesToCrop: ['content'],
    cropLength: 200,
  });
}

/**
 * 获取索引统计信息
 */
export async function getIndexStats() {
  const index = await getDocumentsIndex();
  return index.getStats();
}

/**
 * 检查 MeiliSearch 是否可用
 */
export async function checkMeiliHealth(): Promise<boolean> {
  try {
    const client = getMeiliClient();
    await client.health();
    return true;
  } catch {
    return false;
  }
}
