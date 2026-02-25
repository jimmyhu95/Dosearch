// 混合搜索服务 - 结合全文搜索和语义搜索

import { searchDocuments, checkMeiliHealth, type MeiliDocument } from './meilisearch';
import { semanticSearch, initVectorStore } from './vector-search';
import type { SearchQuery, SearchResponse, SearchResult, SearchHighlight, SearchMode } from '@/types';

// ================= 智能翻译字典 =================
// 解决前端中文传参和数据库英文ID不匹配的问题
const CATEGORY_MAP: Record<string, string> = {
  '产品文档': 'product',
  '技术文档': 'tech',
  '报表': 'report',
  '标书': 'bidding',
  '政策文件': 'policy',
  '会议纪要': 'meeting',
  '培训材料': 'training',
  '图片': 'image',
  '报销文件': 'reimbursement',
  '其他记录': 'other'
};

// 解决前端笼统格式（如 Word）和数据库具体后缀（如 docx）不匹配的问题
const FILE_TYPE_MAP: Record<string, string[]> = {
  'word': ['doc', 'docx'],
  'excel': ['xls', 'xlsx', 'csv'],
  'ppt': ['ppt', 'pptx'],
  'pdf': ['pdf'],
  '文本': ['txt', 'md', 'text'],
  '图片': ['png', 'jpg', 'jpeg', 'image'],
};
// ================================================

/**
 * 混合搜索 - 结合全文搜索和语义搜索结果
 */
export async function hybridSearch(query: SearchQuery): Promise<SearchResponse> {
  const startTime = Date.now();
  const {
    q,
    mode = 'hybrid',
    categories,
    fileTypes,
    dateFrom,
    dateTo,
    page = 1,
    limit = 20,
    sortBy = 'relevance',
    sortOrder = 'desc',
  } = query;

  // 构建过滤条件
  const filters: string[] = [];

  // 1. 修复分类筛选（中文转英文ID）
  if (categories && categories.length > 0) {
    const cats = categories.map(c => {
      const mapped = CATEGORY_MAP[c] || c; // 如果字典里没有，就用原值兜底
      return `"${mapped}"`;
    }).join(', ');
    filters.push(`categories IN [${cats}]`);
  }

  // 2. 修复文件类型筛选（包含大小写与扩展名群组支持）
  if (fileTypes && fileTypes.length > 0) {
    const mappedTypes = new Set<string>();
    fileTypes.forEach(t => {
      const key = t.toLowerCase();
      // 如果命中字典（比如选了 Word，自动展开为 doc 和 docx）
      if (FILE_TYPE_MAP[key]) {
        FILE_TYPE_MAP[key].forEach(ext => {
          mappedTypes.add(`"${ext}"`);
          mappedTypes.add(`"${ext.toUpperCase()}"`); // 兼容大写后缀
        });
      } else {
        mappedTypes.add(`"${key}"`);
        mappedTypes.add(`"${t.toUpperCase()}"`);
      }
    });
    const typesStr = Array.from(mappedTypes).join(', ');
    filters.push(`fileType IN [${typesStr}]`);
  }

  // 3. 时间筛选
  if (dateFrom) {
    filters.push(`createdAt >= ${new Date(dateFrom).getTime()}`);
  }
  if (dateTo) {
    filters.push(`createdAt <= ${new Date(dateTo).getTime()}`);
  }

  const filterString = filters.length > 0 ? filters.join(' AND ') : undefined;

  // 构建排序
  const sort: string[] = [];
  if (sortBy === 'date') {
    sort.push(`createdAt:${sortOrder}`);
  } else if (sortBy === 'title') {
    sort.push(`title:${sortOrder}`);
  }

  let results: SearchResult[] = [];
  let total = 0;

  try {
    if (mode === 'fulltext' || mode === 'hybrid') {

      // 4. 彻底修复中文分词拆字问题（防御尾部空格）
      const trimmedQ = (q || '').trim();
      let searchQuery = trimmedQ;
      // 如果没有空格（说明是连贯短语如“产科”），且没有加引号，强制包裹双引号进行绝对匹配
      if (trimmedQ && !trimmedQ.includes('"') && !trimmedQ.includes(' ')) {
        searchQuery = `"${trimmedQ}"`;
      }

      // 全文搜索
      const meiliResults = await searchDocuments(searchQuery, {
        filter: filterString,
        sort: sort.length > 0 ? sort : undefined,
        limit: mode === 'hybrid' ? limit * 2 : limit,
        offset: (page - 1) * limit,
      });

      const fulltextResults: SearchResult[] = meiliResults.hits.map((hit) => ({
        document: {
          id: hit.id,
          title: hit.title,
          filePath: hit.filePath,
          fileType: hit.fileType as 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'txt',
          fileSize: hit.fileSize,
          content: null,
          summary: hit.summary,
          createdAt: new Date(hit.createdAt),
          modifiedAt: hit.modifiedAt ? new Date(hit.modifiedAt) : null,
          indexedAt: null,
          fileHash: '',
          metadata: null,
          categories: hit.categories.map((catId, idx) => ({
            categoryId: catId,
            categoryName: hit.categoryNames[idx] || catId,
            categorySlug: catId,
            confidence: 1,
          })),
          keywords: hit.keywords.map(k => ({ id: k, keyword: k, weight: 1 })),
        },
        score: 1 - (meiliResults.hits.indexOf(hit) / meiliResults.hits.length),
        highlights: extractHighlights(hit._formatted),
      }));

      results = fulltextResults;
      total = meiliResults.estimatedTotalHits || meiliResults.hits.length;
    }

    if (mode === 'semantic' || mode === 'hybrid') {
      // 语义搜索 (保持原有逻辑不变)
      await initVectorStore();
      const semanticResults = await semanticSearch(q, mode === 'hybrid' ? limit : limit * 2);

      if (mode === 'semantic') {
        results = semanticResults.map(sr => ({
          document: {
            id: sr.id,
            title: (sr.metadata?.title as string) || sr.id,
            filePath: (sr.metadata?.filePath as string) || '',
            fileType: (sr.metadata?.fileType as 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'txt') || 'txt',
            fileSize: 0,
            content: null,
            summary: null,
            createdAt: new Date(),
            modifiedAt: null,
            indexedAt: null,
            fileHash: '',
            metadata: null,
            categories: [],
            keywords: [],
          },
          score: sr.score,
          highlights: [],
        }));
        total = semanticResults.length;
      } else {
        results = mergeResults(results, semanticResults);
        total = results.length;
      }
    }
  } catch (error) {
    console.error('Search error:', error);
    if (mode !== 'semantic') {
      const isHealthy = await checkMeiliHealth();
      if (!isHealthy) {
        console.warn('MeiliSearch is not available, falling back to semantic search');
        await initVectorStore();
        const semanticResults = await semanticSearch(q, limit);
        results = semanticResults.map(sr => ({
          document: {
            id: sr.id,
            title: (sr.metadata?.title as string) || sr.id,
            filePath: (sr.metadata?.filePath as string) || '',
            fileType: (sr.metadata?.fileType as 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'txt') || 'txt',
            fileSize: 0,
            content: null,
            summary: null,
            createdAt: new Date(),
            modifiedAt: null,
            indexedAt: null,
            fileHash: '',
            metadata: null,
            categories: [],
            keywords: [],
          },
          score: sr.score,
          highlights: [],
        }));
        total = semanticResults.length;
      }
    }
  }

  const paginatedResults = results.slice(0, limit);
  const totalPages = Math.ceil(total / limit);
  const processingTime = Date.now() - startTime;

  return {
    results: paginatedResults,
    total,
    page,
    limit,
    totalPages,
    query: q,
    mode,
    processingTime,
  };
}

/**
 * 从 MeiliSearch 格式化结果中提取高亮信息
 */
function extractHighlights(formatted?: Record<string, unknown>): SearchHighlight[] {
  const highlights: SearchHighlight[] = [];
  if (!formatted) return highlights;

  const fields = ['title', 'content', 'summary'];
  for (const field of fields) {
    const value = formatted[field];
    if (typeof value === 'string' && value.includes('<mark>')) {
      const matchedWords = value.match(/<mark>([^<]+)<\/mark>/g)?.map(m =>
        m.replace(/<\/?mark>/g, '')
      ) || [];

      highlights.push({
        field,
        snippet: value,
        matchedWords,
      });
    }
  }
  return highlights;
}

/**
 * 合并全文搜索和语义搜索结果
 */
function mergeResults(
  fulltextResults: SearchResult[],
  semanticResults: Array<{ id: string; score: number }>
): SearchResult[] {
  const semanticScores = new Map(semanticResults.map(r => [r.id, r.score]));

  const mergedResults = fulltextResults.map(result => {
    const semanticScore = semanticScores.get(result.document.id) || 0;
    const hybridScore = result.score * 0.7 + semanticScore * 0.3;
    return {
      ...result,
      score: hybridScore,
    };
  });

  return mergedResults.sort((a, b) => b.score - a.score);
}

/**
 * 获取搜索建议
 */
export async function getSearchSuggestions(
  query: string,
  limit: number = 5
): Promise<string[]> {
  if (!query || query.length < 2) {
    return [];
  }
  try {
    const results = await searchDocuments(query, { limit });
    const suggestions = new Set<string>();

    for (const hit of results.hits) {
      if (hit.title.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(hit.title);
      }
      for (const keyword of hit.keywords) {
        if (keyword.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(keyword);
        }
      }
    }
    return Array.from(suggestions).slice(0, limit);
  } catch {
    return [];
  }
}

export { checkMeiliHealth, initializeIndex } from './meilisearch';
export { initVectorStore, addVector, addVectors, removeVector } from './vector-search';