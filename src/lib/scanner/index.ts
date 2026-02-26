// 文件扫描器 - 扫描本地文件夹并处理文档

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { nanoid } from 'nanoid';
import { db, initializeDatabase } from '../db';
import { documents, categories, documentCategories, keywords, scanHistory } from '../db/schema';
import { indexDocument, initializeIndex, type MeiliDocument } from '../search/meilisearch';
import { parseDocument, getFileType, SUPPORTED_EXTENSIONS } from '../parsers';
import { addVector } from '../search/vector-search';
import { getDocumentCategories, generateSummary, extractKeywords } from '../classifier';
import { CATEGORY_DEFINITIONS } from '../classifier/categories';
import { eq, ne, inArray, and, sql } from 'drizzle-orm';
import type { FileType, ScanHistory } from '@/types';

export interface ScanOptions {
  recursive?: boolean;
  includeHidden?: boolean;
  fileTypes?: string[];
  excludePatterns?: string[];
  onProgress?: (progress: ScanProgress) => void;
}

export interface ScanProgress {
  phase: 'scanning' | 'processing' | 'indexing' | 'completed';
  totalFiles: number;
  processedFiles: number;
  currentFile?: string;
  newFiles: number;
  updatedFiles: number;
  errors: string[];
}

export interface ScanResult {
  scanId: string;
  totalFiles: number;
  processedFiles: number;
  newFiles: number;
  updatedFiles: number;
  errors: string[];
  duration: number;
}

/**
 * 计算文件哈希
 */
async function calculateFileHash(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  return crypto.createHash('md5').update(buffer).digest('hex');
}

/**
 * 检查文件是否应该被扫描
 */
function shouldScanFile(
  filePath: string,
  options: ScanOptions
): boolean {
  const fileName = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();

  // 检查是否为隐藏文件
  if (!options.includeHidden && fileName.startsWith('.')) {
    return false;
  }

  // 检查文件类型
  if (options.fileTypes && options.fileTypes.length > 0) {
    if (!options.fileTypes.includes(ext)) {
      return false;
    }
  } else {
    // 默认只扫描支持的文件类型
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      return false;
    }
  }

  // 检查排除模式
  if (options.excludePatterns) {
    for (const pattern of options.excludePatterns) {
      if (filePath.includes(pattern) || fileName.match(new RegExp(pattern))) {
        return false;
      }
    }
  }

  return true;
}

// 支持的扩展名列表（前置过滤，提升性能）
const SUPPORTED_EXTS = new Set(SUPPORTED_EXTENSIONS);

export async function getFilesRecursively(dirPath: string): Promise<string[]> {
  let results: string[] = [];
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      // 忽略隐藏文件和系统目录
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // 【关键】：如果是文件夹，等待递归完成并合并结果
        const subFiles = await getFilesRecursively(fullPath);
        results = results.concat(subFiles);
      } else {
        // 如果是文件，检查扩展名是否在支持列表中
        const ext = path.extname(entry.name).toLowerCase();
        if (SUPPORTED_EXTS.has(ext)) {
          results.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`[Scanner] 无法读取路径或权限拒绝: ${dirPath}`, error);
  }
  return results;
}

/**
 * 初始化/同步默认分类（可多次调用，幂等）
 */
export async function initializeCategories(): Promise<void> {
  for (const catDef of CATEGORY_DEFINITIONS) {
    try {
      await db.insert(categories).values({
        id: catDef.id,
        name: catDef.name,
        slug: catDef.slug,
        description: catDef.description,
        icon: catDef.icon,
        color: catDef.color,
        sortOrder: CATEGORY_DEFINITIONS.indexOf(catDef),
      }).onConflictDoNothing();
    } catch {
      // 分类可能已存在
    }
  }

  // 清理历史错误：删除非图片文件被误归入 image 分类的记录（两步，避免子查询兼容性问题）
  try {
    const nonImageDocs = await db
      .select({ id: documents.id })
      .from(documents)
      .where(ne(documents.fileType, 'image'));
    if (nonImageDocs.length > 0) {
      const ids = nonImageDocs.map((d) => d.id);
      await db
        .delete(documentCategories)
        .where(and(eq(documentCategories.categoryId, 'image'), inArray(documentCategories.documentId, ids)));
    }
  } catch (e) {
    console.warn('Category cleanup error:', e);
  }
}

/**
 * 处理单个文件
 */
async function processFile(
  filePath: string,
  existingDoc?: { id: string; fileHash: string }
): Promise<{ isNew: boolean; isUpdated: boolean; error?: string }> {
  try {
    const stats = await fs.stat(filePath);
    const fileHash = await calculateFileHash(filePath);

    // 检查文件是否已存在且未修改
    if (existingDoc && existingDoc.fileHash === fileHash) {
      return { isNew: false, isUpdated: false };
    }

    const ext = path.extname(filePath).toLowerCase();
    const fileType = getFileType(filePath) as FileType;

    // ─── OFD 硬拦截：跳过解析与分类，直接归入报销文件 ───
    if (ext === '.ofd') {
      const ofdTitle = path.basename(filePath, ext);
      const ofdSummary = '系统自动识别为 OFD 电子发票文件';
      const ofdCategories = [{ categoryId: 'reimbursement', categoryName: '报销文件', confidence: 1 }];

      const docId = existingDoc?.id || nanoid();
      const now = new Date().toISOString();

      if (existingDoc) {
        await db.update(documents)
          .set({
            title: ofdTitle,
            content: '',
            summary: ofdSummary,
            fileHash,
            modifiedAt: now,
            indexedAt: now,
            metadata: JSON.stringify({ format: 'OFD' }),
          })
          .where(eq(documents.id, existingDoc.id));
        await db.delete(documentCategories).where(eq(documentCategories.documentId, existingDoc.id));
        await db.delete(keywords).where(eq(keywords.documentId, existingDoc.id));
      } else {
        await db.insert(documents).values({
          id: docId,
          title: ofdTitle,
          filePath,
          fileType,
          fileSize: stats.size,
          content: '',
          summary: ofdSummary,
          createdAt: now,
          modifiedAt: now,
          indexedAt: now,
          fileHash,
          metadata: JSON.stringify({ format: 'OFD' }),
        });
      }

      for (const cat of ofdCategories) {
        await db.insert(documentCategories).values({
          documentId: docId,
          categoryId: cat.categoryId,
          confidence: cat.confidence,
        });
      }

      const meiliDoc: MeiliDocument = {
        id: docId,
        title: ofdTitle,
        content: '',
        summary: ofdSummary,
        fileType,
        filePath,
        categories: ofdCategories.map(c => c.categoryId),
        categoryNames: ofdCategories.map(c => c.categoryName),
        keywords: [],
        createdAt: new Date(now).getTime(),
        modifiedAt: new Date(now).getTime(),
        fileSize: stats.size,
      };

      try { await indexDocument(meiliDoc); } catch (e) {
        console.warn('Failed to index OFD document to MeiliSearch:', e);
      }

      return { isNew: !existingDoc, isUpdated: !!existingDoc };
    }

    // ─── 常规文件处理 ───
    const parsed = await parseDocument(filePath);

    // 生成摘要 (必须加上 await)
    const summary = await generateSummary(parsed.content, 300);

    // 分类文档：图片归图片，Excel归报表，其余走分类器 (使用 ext 判断，并加上 await)
    const docCategories = fileType === 'image'
      ? [{ categoryId: 'image', categoryName: '图片', confidence: 1 }]
      : (ext === '.xlsx' || ext === '.xls')
        ? [{ categoryId: 'report', categoryName: '报表', confidence: 1 }]
        : await getDocumentCategories(parsed.content, parsed.title);

    // 提取关键词 (必须加上 await)
    const docKeywords = await extractKeywords(parsed.content, 20, 2);

    const docId = existingDoc?.id || nanoid();
    const now = new Date().toISOString();

    // 保存或更新文档
    if (existingDoc) {
      await db.update(documents)
        .set({
          title: parsed.title,
          content: parsed.content,
          summary,
          fileHash,
          modifiedAt: now,
          indexedAt: now,
          metadata: parsed.metadata, // 💡 修复：去掉 JSON.stringify，让 Drizzle 底层自动处理
        })
        .where(eq(documents.id, existingDoc.id));

      // 删除旧的分类和关键词
      await db.delete(documentCategories).where(eq(documentCategories.documentId, existingDoc.id));
      await db.delete(keywords).where(eq(keywords.documentId, existingDoc.id));
    } else {
      await db.insert(documents).values({
        id: docId,
        title: parsed.title,
        filePath,
        fileType,
        fileSize: stats.size,
        content: parsed.content,
        summary,
        createdAt: now,
        modifiedAt: now,
        indexedAt: now,
        fileHash,
        metadata: parsed.metadata, // 💡 修复：去掉 JSON.stringify
      });
    }

    // 保存分类关联
    for (const cat of docCategories) {
      // 💡 终极防御：兼容 AI 返回的 id 和 我们硬编码返回的 categoryId
      const finalCategoryId = cat.categoryId || (cat as any).id || 'other';
      await db.insert(documentCategories).values({
        documentId: docId,
        categoryId: finalCategoryId,
        confidence: cat.confidence || 1,
      });
    }

    // 保存关键词 (兼容修复版保持不变)
    for (const kw of docKeywords) {
      const keywordText = typeof kw === 'string' ? kw : kw.keyword;
      const keywordWeight = typeof kw === 'string' ? 1.0 : (kw.weight || 1.0);

      if (!keywordText) continue;

      await db.insert(keywords).values({
        id: nanoid(),
        documentId: docId,
        keyword: keywordText,
        weight: keywordWeight,
      });
    }

    // 索引到搜索引擎
    const meiliDoc: MeiliDocument = {
      id: docId,
      title: parsed.title,
      content: parsed.content,
      summary,
      fileType,
      filePath,
      categories: docCategories.map(c => c.categoryId || (c as any).id || 'other'),
      categoryNames: docCategories.map(c => c.categoryName || (c as any).name || '其他'),
      keywords: docKeywords.map(k => typeof k === 'string' ? k : k.keyword).filter(Boolean),
      createdAt: new Date(now).getTime(),
      modifiedAt: new Date(now).getTime(),
      fileSize: stats.size,
    };

    try {
      await indexDocument(meiliDoc);
    } catch (error) {
      console.warn('Failed to index document to MeiliSearch:', error);
    }

    // 添加到向量搜索
    try {
      await addVector(docId, `${parsed.title} ${parsed.content}`, {
        title: parsed.title,
        filePath,
        fileType,
      });
    } catch (error) {
      console.warn('Failed to add document to vector store:', error);
    }

    return {
      isNew: !existingDoc,
      isUpdated: !!existingDoc,
    };
  } catch (error) {
    // 🚨 核心大招：强行把被吞掉的错误大字打印到你的 Node.js 黑框控制台上！
    console.error(`\n❌ [终极排查] 文件处理在某一步崩溃了！文件: ${filePath}`);
    console.error(error);
    console.error(`-----------------------------------------\n`);

    return {
      isNew: false,
      isUpdated: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 扫描文件夹
 */
export async function scanFolder(
  folderPath: string,
  options: ScanOptions = {}
): Promise<ScanResult> {
  const startTime = Date.now();
  const scanId = nanoid();

  // 初始化数据库
  initializeDatabase();

  // 初始化分类
  await initializeCategories();

  // [新增！] 强制同步并激活 MeiliSearch 的可筛选字段配置
  await initializeIndex();

  const progress: ScanProgress = {
    phase: 'scanning',
    totalFiles: 0,
    processedFiles: 0,
    newFiles: 0,
    updatedFiles: 0,
    errors: [],
  };

  // 创建扫描记录
  await db.insert(scanHistory).values({
    id: scanId,
    scanPath: folderPath,
    startedAt: new Date().toISOString(),
    status: 'running',
  });

  try {
    // 扫描文件
    progress.phase = 'scanning';
    options.onProgress?.(progress);

    const files = await getFilesRecursively(folderPath);
    console.log(`[Scanner] 共发现待处理文件: ${files.length} 个`);
    progress.totalFiles = files.length;

    // 获取现有文档
    const existingDocs = await db.select({
      id: documents.id,
      filePath: documents.filePath,
      fileHash: documents.fileHash,
    }).from(documents);

    const existingDocsMap = new Map(
      existingDocs.map(d => [d.filePath, { id: d.id, fileHash: d.fileHash }])
    );

    // 处理文件
    progress.phase = 'processing';

    for (const filePath of files) {
      progress.currentFile = filePath;
      options.onProgress?.(progress);

      const existingDoc = existingDocsMap.get(filePath);

      // 单文件 120s 超时保护，防止大文件或 API 调用阻塞整个扫描
      const FILE_TIMEOUT_MS = 120_000;
      const result = await Promise.race([
        processFile(filePath, existingDoc || undefined),
        new Promise<{ isNew: boolean; isUpdated: boolean; error: string }>((resolve) =>
          setTimeout(
            () => resolve({ isNew: false, isUpdated: false, error: '处理超时（>120s），已跳过' }),
            FILE_TIMEOUT_MS
          )
        ),
      ]);


      progress.processedFiles++;

      if (result.isNew) {
        progress.newFiles++;
      } else if (result.isUpdated) {
        progress.updatedFiles++;
      }

      if (result.error) {
        progress.errors.push(`${filePath}: ${result.error}`);
      }

      options.onProgress?.(progress);
    }

    // 更新扫描记录
    progress.phase = 'completed';
    options.onProgress?.(progress);

    await db.update(scanHistory)
      .set({
        completedAt: new Date().toISOString(),
        totalFiles: progress.totalFiles,
        processedFiles: progress.processedFiles,
        newFiles: progress.newFiles,
        updatedFiles: progress.updatedFiles,
        status: 'completed',
      })
      .where(eq(scanHistory.id, scanId));

    return {
      scanId,
      totalFiles: progress.totalFiles,
      processedFiles: progress.processedFiles,
      newFiles: progress.newFiles,
      updatedFiles: progress.updatedFiles,
      errors: progress.errors,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    // 更新扫描记录为失败
    await db.update(scanHistory)
      .set({
        completedAt: new Date().toISOString(),
        status: 'failed',
      })
      .where(eq(scanHistory.id, scanId));

    throw error;
  }
}

/**
 * 获取扫描历史
 */
export async function getScanHistory(limit: number = 10): Promise<ScanHistory[]> {
  const history = await db.select()
    .from(scanHistory)
    .orderBy(scanHistory.startedAt)
    .limit(limit);

  return history.map(h => {
    const startedAt = new Date(h.startedAt);
    const completedAt = h.completedAt ? new Date(h.completedAt) : null;
    return {
      id: h.id,
      scanPath: h.scanPath,
      startedAt: isNaN(startedAt.getTime()) ? new Date() : startedAt,
      completedAt: completedAt && isNaN(completedAt.getTime()) ? null : completedAt,
      totalFiles: h.totalFiles || 0,
      processedFiles: h.processedFiles || 0,
      newFiles: h.newFiles || 0,
      updatedFiles: h.updatedFiles || 0,
      status: h.status as 'running' | 'completed' | 'failed',
    };
  });
}
