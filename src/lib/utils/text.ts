// 文本处理工具函数

/**
 * 截断文本
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * 移除 HTML 标签
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * 高亮关键词
 */
export function highlightKeywords(
  text: string,
  keywords: string[],
  tag: string = 'mark'
): string {
  let result = text;
  
  for (const keyword of keywords) {
    const regex = new RegExp(`(${escapeRegExp(keyword)})`, 'gi');
    result = result.replace(regex, `<${tag}>$1</${tag}>`);
  }
  
  return result;
}

/**
 * 转义正则表达式特殊字符
 */
export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 提取文本片段（用于搜索结果预览）
 */
export function extractSnippet(
  text: string,
  query: string,
  contextLength: number = 100
): string {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  const index = lowerText.indexOf(lowerQuery);
  
  if (index === -1) {
    return truncateText(text, contextLength * 2);
  }
  
  const start = Math.max(0, index - contextLength);
  const end = Math.min(text.length, index + query.length + contextLength);
  
  let snippet = text.slice(start, end);
  
  if (start > 0) {
    snippet = '...' + snippet;
  }
  
  if (end < text.length) {
    snippet = snippet + '...';
  }
  
  return snippet;
}

/**
 * 计算文本相似度 (Levenshtein 距离)
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

/**
 * 计算文本相似度 (0-1)
 */
export function textSimilarity(a: string, b: string): number {
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 1;
  
  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
  return 1 - distance / maxLength;
}

/**
 * 规范化空白字符
 */
export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * 提取文件名（不含扩展名）
 */
export function getFileNameWithoutExt(filePath: string): string {
  const fileName = filePath.split(/[/\\]/).pop() || filePath;
  const lastDot = fileName.lastIndexOf('.');
  return lastDot > 0 ? fileName.slice(0, lastDot) : fileName;
}
