// 数据库 Schema 定义 (Drizzle ORM)

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// 文档表
export const documents = sqliteTable('documents', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  filePath: text('file_path').notNull().unique(),
  fileType: text('file_type').notNull(), // pdf, docx, xlsx, pptx, txt
  fileSize: integer('file_size').notNull(),
  content: text('content'),
  summary: text('summary'),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
  modifiedAt: text('modified_at'),
  indexedAt: text('indexed_at'),
  fileHash: text('file_hash').notNull(),
  metadata: text('metadata', { mode: 'json' }),
});

// 分类表
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  parentId: text('parent_id'),
  icon: text('icon'),
  color: text('color'),
  sortOrder: integer('sort_order').default(0),
});

// 文档-分类关联表
export const documentCategories = sqliteTable('document_categories', {
  documentId: text('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  confidence: real('confidence').default(1.0),
});

// 关键词表
export const keywords = sqliteTable('keywords', {
  id: text('id').primaryKey(),
  documentId: text('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  keyword: text('keyword').notNull(),
  weight: real('weight').default(1.0),
});

// 扫描历史表
export const scanHistory = sqliteTable('scan_history', {
  id: text('id').primaryKey(),
  scanPath: text('scan_path').notNull(),
  startedAt: text('started_at').notNull().default('CURRENT_TIMESTAMP'),
  completedAt: text('completed_at'),
  totalFiles: integer('total_files').default(0),
  processedFiles: integer('processed_files').default(0),
  newFiles: integer('new_files').default(0),
  updatedFiles: integer('updated_files').default(0),
  status: text('status').default('running'), // running, completed, failed
});

// 扫描配置表
export const scanConfigs = sqliteTable('scan_configs', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  paths: text('paths', { mode: 'json' }).notNull(), // JSON array of paths
  recursive: integer('recursive', { mode: 'boolean' }).default(true),
  includeHidden: integer('include_hidden', { mode: 'boolean' }).default(false),
  fileTypes: text('file_types', { mode: 'json' }), // JSON array of extensions
  excludePatterns: text('exclude_patterns', { mode: 'json' }), // JSON array of patterns
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at'),
});

// 关系定义
export const documentsRelations = relations(documents, ({ many }) => ({
  categories: many(documentCategories),
  keywords: many(keywords),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
  documents: many(documentCategories),
}));

export const documentCategoriesRelations = relations(documentCategories, ({ one }) => ({
  document: one(documents, {
    fields: [documentCategories.documentId],
    references: [documents.id],
  }),
  category: one(categories, {
    fields: [documentCategories.categoryId],
    references: [categories.id],
  }),
}));

export const keywordsRelations = relations(keywords, ({ one }) => ({
  document: one(documents, {
    fields: [keywords.documentId],
    references: [documents.id],
  }),
}));
