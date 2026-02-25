// 运行时配置管理 —— 读写 app_settings 表，带简单内存缓存

import { getRawDb, initializeDatabase } from './db';

// 确保表存在
let initialized = false;
function ensureInit() {
    if (!initialized) {
        initializeDatabase();
        initialized = true;
    }
}

// 内存缓存（进程级别，重启清空）
const cache: Record<string, string> = {};

export function getSetting(key: string, defaultValue = ''): string {
    if (key in cache) return cache[key];
    ensureInit();
    const db = getRawDb();
    const row = db
        .prepare('SELECT value FROM app_settings WHERE key = ?')
        .get(key) as { value: string } | undefined;
    const val = row?.value ?? process.env[key.toUpperCase()] ?? defaultValue;
    cache[key] = val;
    return val;
}

export function setSetting(key: string, value: string): void {
    ensureInit();
    const db = getRawDb();
    db.prepare(`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at
  `).run(key, value);
    cache[key] = value;
}

export function getAllSettings(): Record<string, string> {
    ensureInit();
    const db = getRawDb();
    const rows = db
        .prepare('SELECT key, value FROM app_settings')
        .all() as Array<{ key: string; value: string }>;
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

// 清除缓存（测试用）
export function clearSettingsCache() {
    Object.keys(cache).forEach((k) => delete cache[k]);
}
