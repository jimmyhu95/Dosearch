// 数据库连接与初始化

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

// 数据库文件路径
const DATA_DIR = path.join(process.cwd(), 'data', 'db');
const DB_PATH = path.join(DATA_DIR, 'documents.db');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 创建数据库连接
const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// 创建 Drizzle 实例
export const db = drizzle(sqlite, { schema });

// 初始化数据库表
export function initializeDatabase() {
  // 创建文档表
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      file_path TEXT NOT NULL UNIQUE,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      content TEXT,
      summary TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      modified_at TEXT,
      indexed_at TEXT,
      file_hash TEXT NOT NULL,
      metadata TEXT
    )
  `);

  // 创建分类表
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      parent_id TEXT REFERENCES categories(id),
      icon TEXT,
      color TEXT,
      sort_order INTEGER DEFAULT 0
    )
  `);

  // 创建文档-分类关联表
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS document_categories (
      document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      confidence REAL DEFAULT 1.0,
      PRIMARY KEY (document_id, category_id)
    )
  `);

  // 创建关键词表
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS keywords (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      keyword TEXT NOT NULL,
      weight REAL DEFAULT 1.0,
      UNIQUE(document_id, keyword)
    )
  `);

  // 创建扫描历史表
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS scan_history (
      id TEXT PRIMARY KEY,
      scan_path TEXT NOT NULL,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      total_files INTEGER DEFAULT 0,
      processed_files INTEGER DEFAULT 0,
      new_files INTEGER DEFAULT 0,
      updated_files INTEGER DEFAULT 0,
      status TEXT DEFAULT 'running'
    )
  `);

  // 创建扫描配置表
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS scan_configs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      paths TEXT NOT NULL,
      recursive INTEGER DEFAULT 1,
      include_hidden INTEGER DEFAULT 0,
      file_types TEXT,
      exclude_patterns TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT
    )
  `);

  // 创建应用配置表（key-value）
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // 创建索引
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_documents_file_type ON documents(file_type);
    CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
    CREATE INDEX IF NOT EXISTS idx_documents_file_hash ON documents(file_hash);
    CREATE INDEX IF NOT EXISTS idx_keywords_keyword ON keywords(keyword);
    CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
  `);

  console.log('Database initialized successfully');
}

// 获取原始 SQLite 连接（用于直接查询）
export function getRawDb() {
  return sqlite;
}

// 关闭数据库连接
export function closeDatabase() {
  sqlite.close();
}

// 导出 schema
export { schema };
