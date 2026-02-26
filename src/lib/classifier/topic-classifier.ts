// 主题分类器 - 基于关键词和模式匹配的文档分类

import { CATEGORY_DEFINITIONS, type CategoryDefinition } from '@/lib/classifier/categories';
import { extractKeywords } from '@/lib/classifier/keyword-extractor';

export interface ClassificationResult {
  categoryId: string;
  categoryName: string;
  confidence: number;
  matchedKeywords: string[];
  matchedPatterns: number;
}

export function classifyDocument(
  content: string,
  title: string = ''
): ClassificationResult[] {
  const fullText = `${title} ${content}`.toLowerCase();
  const results: ClassificationResult[] = [];

  // 提取文档关键词
  const docKeywords = extractKeywords(fullText, 100, 1);
  const docKeywordSet = new Set(docKeywords.map(k => k.keyword));

  for (const category of CATEGORY_DEFINITIONS) {
    if (category.id === 'other' || category.id === 'image') continue;

    let score = 0;
    const matchedKeywords: string[] = [];
    let matchedPatterns = 0;

    // 关键词匹配
    for (const keyword of category.keywords) {
      const lowerKeyword = keyword.toLowerCase();

      // 直接匹配
      if (fullText.includes(lowerKeyword)) {
        score += 2;
        matchedKeywords.push(keyword);
      }

      // 文档关键词匹配
      if (docKeywordSet.has(lowerKeyword)) {
        score += 1;
        if (!matchedKeywords.includes(keyword)) {
          matchedKeywords.push(keyword);
        }
      }
    }

    // 模式匹配
    for (const pattern of category.patterns) {
      const matches = fullText.match(pattern);
      if (matches) {
        score += matches.length * 3;
        matchedPatterns++;
      }
    }

    /** 
     * 【增强分类排他性边界规则】
     */
    if (category.id === 'product') {
      // 只要文件名或摘要中带有“产品方案”或“产品介绍”，给予 product 极高的置信度
      if (title.includes('产品方案') || title.includes('产品介绍') || content.slice(0, 500).includes('产品方案')) {
        score += 100; // 绝对优势分数
      }
    }

    if (category.id === 'bidding' && score > 0) {
      // 绝对不允许仅仅因为包含“解决方案”、“规划”而归入标书
      // 必须包含实质性的商务招投标动作词汇
      const hardBiddingWords = ['招标', '投标', '评分标准', '偏离表', '废标', '开标', '标书', '评标', '招标文件', '询价单', '商务技术响应'];
      const hasHardEvidence = hardBiddingWords.some(w => fullText.includes(w));
      if (!hasHardEvidence) {
        // 没有实质性商务特征词，立刻剔除 bidding 标签
        score = 0;
      }
    }

    /** 
     * 【增强分类：会议纪要判定】
     */
    if (category.id === 'meeting') {
      // 针对 IT 产品经理的高频业务词汇进行标题加权
      const meetingTitleKeywords = ['交流', '访谈', '访谈纪要', '调研', '座谈', '汇报', '会议', '拜访'];
      const hasMeetingTitle = meetingTitleKeywords.some(kw => title.includes(kw));

      if (hasMeetingTitle) {
        // 发现标题含有交流/纪要等词，赋予绝对优势分，确保其不流向“其他”
        score += 100;
      }
    }

    /**
     * 【增强分类：发票/报销文件判定】
     * 文件名包含"发票"时，给予 reimbursement 绝对优势分
     */
    if (category.id === 'reimbursement') {
      if (title.includes('发票')) {
        score += 100;
      }
    }

    if (score > 0) {
      // 【修复数学漏洞】：废弃按字典长度动态计算分母的做法
      // 设定 15 分为一个较为合理的满分基线。命中 7-8 个词即可达到极高置信度。
      const confidence = Math.min(score / 15, 1.0);

      results.push({
        categoryId: category.id,
        categoryName: category.name,
        confidence: confidence, // 已经通过 Math.min 限制在 1.0 以内
        matchedKeywords,
        matchedPatterns,
      });
    }
  }

  // 按置信度排序
  results.sort((a, b) => b.confidence - a.confidence);

  // 如果没有匹配到任何分类，返回"其他"
  if (results.length === 0) {
    results.push({
      categoryId: 'other',
      categoryName: '其他记录',
      confidence: 1,
      matchedKeywords: [],
      matchedPatterns: 0,
    });
  }

  return results;
}

/**
 * 获取文档的主要分类
 */
export function getPrimaryCategory(
  content: string,
  title: string = ''
): ClassificationResult {
  const results = classifyDocument(content, title);
  return results[0];
}

/**
 * 获取文档的多个分类（置信度高于阈值）
 */
export function getDocumentCategories(
  content: string,
  title: string = '',
  confidenceThreshold: number = 0.1,
  maxCategories: number = 2 // 【标签降噪】只保留得分最高的 1 到 2 个分类
): ClassificationResult[] {
  let results = classifyDocument(content, title);

  results = results.filter(r => r.confidence >= confidenceThreshold);

  // 【冲突判定逻辑】: 如果命中了 product 和 bidding
  const hasProduct = results.find(r => r.categoryId === 'product');
  const hasBidding = results.find(r => r.categoryId === 'bidding');

  if (hasProduct && hasBidding) {
    // 比较技术词汇量 vs 商务词汇量（简单用置信度对比或强制产品优先）
    if (hasProduct.confidence >= hasBidding.confidence * 0.5) {
      // 产品技术权重比较明显时，丢弃 bidding
      results = results.filter(r => r.categoryId !== 'bidding');
    }
  }

  return results.slice(0, maxCategories);
}

/**
 * 生成文档摘要（简单实现）
 */
export function generateSummary(content: string, maxLength: number = 200): string {
  // 移除多余空白
  const cleaned = content.replace(/\s+/g, ' ').trim();

  // 按句子分割
  const sentences = cleaned.split(/[。！？.!?]+/).filter(s => s.trim().length > 10);

  if (sentences.length === 0) {
    return cleaned.slice(0, maxLength);
  }

  // 取前几个句子作为摘要
  let summary = '';
  for (const sentence of sentences) {
    if (summary.length + sentence.length > maxLength) {
      break;
    }
    summary += sentence.trim() + '。';
  }

  if (summary.length === 0) {
    summary = sentences[0].slice(0, maxLength) + '...';
  }

  return summary;
}

/**
 * 批量分类文档
 */
export function classifyDocuments(
  documents: Array<{ id: string; content: string; title: string }>
): Map<string, ClassificationResult[]> {
  const results = new Map<string, ClassificationResult[]>();

  for (const doc of documents) {
    const categories = getDocumentCategories(doc.content, doc.title);
    results.set(doc.id, categories);
  }

  return results;
}
