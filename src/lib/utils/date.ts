// 日期处理工具函数

import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * 格式化日期
 */
export function formatDate(
  date: Date | string | number,
  formatStr: string = 'yyyy-MM-dd HH:mm'
): string {
  const d = typeof date === 'string' ? parseISO(date) : new Date(date);
  
  if (!isValid(d)) {
    return '-';
  }
  
  return format(d, formatStr, { locale: zhCN });
}

/**
 * 格式化相对时间
 */
export function formatRelativeTime(date: Date | string | number): string {
  const d = typeof date === 'string' ? parseISO(date) : new Date(date);
  
  if (!isValid(d)) {
    return '-';
  }
  
  return formatDistanceToNow(d, { addSuffix: true, locale: zhCN });
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
}

/**
 * 解析日期字符串
 */
export function parseDate(dateStr: string): Date | null {
  const d = parseISO(dateStr);
  return isValid(d) ? d : null;
}

/**
 * 获取日期范围
 */
export function getDateRange(
  range: 'today' | 'week' | 'month' | 'year'
): { from: Date; to: Date } {
  const now = new Date();
  const to = now;
  let from: Date;
  
  switch (range) {
    case 'today':
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      from = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      break;
    case 'year':
      from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
  }
  
  return { from, to };
}
