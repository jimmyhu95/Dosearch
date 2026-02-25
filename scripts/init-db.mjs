import Database from 'better-sqlite3';
import { nanoid } from 'nanoid';

const sqlite = new Database('data/docs.db');

async function init() {
  console.log('Initializing database...');

  // 1. 创建分类
  const defaultCategories = [
    { name: '技术文档', slug: 'technical', description: '代码、架构、技术规范、API文档等', icon: 'Code', color: '#3B82F6' },
    { name: '商业计划', slug: 'business', description: '商业计划书、市场调研、投资意向等', icon: 'Briefcase', color: '#10B981' },
    { name: '学术论文', slug: 'academic', description: '论文、研究报告、实验数据等', icon: 'GraduationCap', color: '#8B5CF6' },
    { name: '法律合约', slug: 'legal', description: '合同、协议、法律条款、政策等', icon: 'FileText', color: '#EF4444' },
    { name: '财务报表', slug: 'financial', description: '发票、报表、审计报告、预算等', icon: 'PieChart', color: '#F59E0B' },
    { name: '产品手册', slug: 'product', description: '产品说明书、用户指南、PRD等', icon: 'BookOpen', color: '#EC4899' },
    { name: '会议纪要', slug: 'meeting', description: '周报、会议记录、行动项等', icon: 'Users', color: '#6366F1' },
    { name: '培训材料', slug: 'training', description: '课件、教程、考试题库等', icon: 'Presentation', color: '#14B8A6' },
    { name: '其他', slug: 'other', description: '无法分类的其他文档', icon: 'MoreHorizontal', color: '#6B7280' }
  ];

  try {
    // 尝试创建表（如果不存在）
    sqlite.prepare(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        parent_id TEXT,
        icon TEXT,
        color TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `).run();
    
    sqlite.prepare(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        file_path TEXT NOT NULL UNIQUE,
        file_name TEXT NOT NULL,
        file_extension TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        content TEXT,
        summary TEXT,
        author TEXT,
        metadata TEXT,
        hash TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        last_modified INTEGER NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `).run();

    sqlite.prepare(`
      CREATE TABLE IF NOT EXISTS document_categories (
        document_id TEXT NOT NULL,
        category_id TEXT NOT NULL,
        confidence REAL DEFAULT 1.0,
        PRIMARY KEY (document_id, category_id)
      )
    `).run();

    sqlite.prepare(`
      CREATE TABLE IF NOT EXISTS keywords (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        keyword TEXT NOT NULL,
        score REAL DEFAULT 1.0
      )
    `).run();

    sqlite.prepare(`
      CREATE TABLE IF NOT EXISTS scan_history (
        id TEXT PRIMARY KEY,
        scan_path TEXT NOT NULL,
        status TEXT NOT NULL,
        total_files INTEGER DEFAULT 0,
        processed_files INTEGER DEFAULT 0,
        new_files INTEGER DEFAULT 0,
        updated_files INTEGER DEFAULT 0,
        error_message TEXT,
        started_at INTEGER NOT NULL,
        ended_at INTEGER
      )
    `).run();
  } catch (e) {
    console.log('Tables might already exist or error creating them:', e.message);
  }

  console.log('Database initialization completed.');
  process.exit(0);
}

init().catch(err => {
  console.error('Initialization failed:', err);
  process.exit(1);
});
