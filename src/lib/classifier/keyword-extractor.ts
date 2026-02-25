// 关键词提取器

export interface ExtractedKeyword {
  keyword: string;
  weight: number;
  frequency: number;
}

// 停用词列表（中英文）
const STOP_WORDS = new Set([
  // 英文停用词
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
  'shall', 'can', 'need', 'dare', 'ought', 'used', 'it', 'its', 'this', 'that',
  'these', 'those', 'i', 'you', 'he', 'she', 'we', 'they', 'what', 'which', 'who',
  'whom', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
  'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
  'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now', 'here', 'there',
  // 中文停用词
  '的', '了', '和', '是', '就', '都', '而', '及', '与', '着', '或', '一个', '没有',
  '我们', '你们', '他们', '它们', '这个', '那个', '这些', '那些', '什么', '怎么',
  '如何', '为什么', '因为', '所以', '但是', '然而', '如果', '虽然', '即使',
  '不', '也', '又', '还', '再', '更', '最', '很', '非常', '可以', '能够', '应该',
]);

/**
 * 分词（简单实现）
 */
function tokenize(text: string): string[] {
  // 移除特殊字符，保留中文、英文和数字
  const cleaned = text.toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const tokens: string[] = [];
  
  // 英文分词
  const englishWords = cleaned.match(/[a-z]+/g) || [];
  tokens.push(...englishWords.filter(w => w.length > 2));
  
  // 中文分词（简单按字符分割，实际应用中可以使用更好的分词库）
  const chineseChars = cleaned.match(/[\u4e00-\u9fa5]+/g) || [];
  for (const chars of chineseChars) {
    // 提取 2-4 字的词组
    for (let len = 2; len <= Math.min(4, chars.length); len++) {
      for (let i = 0; i <= chars.length - len; i++) {
        tokens.push(chars.slice(i, i + len));
      }
    }
  }
  
  return tokens;
}

/**
 * 计算 TF (词频)
 */
function calculateTF(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  const totalTokens = tokens.length;
  
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }
  
  // 归一化
  for (const [token, count] of tf) {
    tf.set(token, count / totalTokens);
  }
  
  return tf;
}

/**
 * 提取关键词
 */
export function extractKeywords(
  text: string,
  maxKeywords: number = 20,
  minFrequency: number = 2
): ExtractedKeyword[] {
  const tokens = tokenize(text);
  
  // 过滤停用词
  const filteredTokens = tokens.filter(t => !STOP_WORDS.has(t));
  
  // 计算词频
  const frequency = new Map<string, number>();
  for (const token of filteredTokens) {
    frequency.set(token, (frequency.get(token) || 0) + 1);
  }
  
  // 计算 TF
  const tf = calculateTF(filteredTokens);
  
  // 生成关键词列表
  const keywords: ExtractedKeyword[] = [];
  
  for (const [keyword, freq] of frequency) {
    if (freq >= minFrequency) {
      keywords.push({
        keyword,
        weight: tf.get(keyword) || 0,
        frequency: freq,
      });
    }
  }
  
  // 按权重排序
  keywords.sort((a, b) => b.weight - a.weight);
  
  return keywords.slice(0, maxKeywords);
}

/**
 * 提取 N-gram
 */
export function extractNgrams(text: string, n: number = 2): string[] {
  const words = text.toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));
  
  const ngrams: string[] = [];
  
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.push(words.slice(i, i + n).join(' '));
  }
  
  return ngrams;
}

/**
 * 计算两个文本的关键词相似度
 */
export function keywordSimilarity(text1: string, text2: string): number {
  const keywords1 = new Set(extractKeywords(text1, 50, 1).map(k => k.keyword));
  const keywords2 = new Set(extractKeywords(text2, 50, 1).map(k => k.keyword));
  
  const intersection = new Set([...keywords1].filter(k => keywords2.has(k)));
  const union = new Set([...keywords1, ...keywords2]);
  
  if (union.size === 0) return 0;
  
  return intersection.size / union.size;
}
