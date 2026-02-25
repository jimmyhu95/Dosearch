// 向量搜索服务 - 基于简单的余弦相似度实现
// 注意：这是一个轻量级实现，适合本地小规模使用

import fs from 'fs/promises';
import path from 'path';

const VECTORS_DIR = path.join(process.cwd(), 'data', 'vectors');
const VECTORS_FILE = path.join(VECTORS_DIR, 'embeddings.json');

// 向量存储结构
interface VectorEntry {
  id: string;
  vector: number[];
  metadata?: Record<string, unknown>;
}

interface VectorStore {
  vectors: VectorEntry[];
  dimension: number;
}

let vectorStore: VectorStore | null = null;

/**
 * 简单的文本向量化（基于词频的 TF-IDF 简化版）
 * 这是一个轻量级实现，不需要外部 AI 模型
 */
export function textToVector(text: string, vocabulary: string[], dimension: number = 384): number[] {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  const wordFreq = new Map<string, number>();
  
  // 计算词频
  for (const word of words) {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  }
  
  // 生成向量
  const vector = new Array(dimension).fill(0);
  
  for (const [word, freq] of wordFreq) {
    // 使用简单的哈希函数将词映射到向量维度
    const hash = simpleHash(word);
    const index = Math.abs(hash) % dimension;
    vector[index] += freq / words.length;
  }
  
  // 归一化
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (magnitude > 0) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] /= magnitude;
    }
  }
  
  return vector;
}

/**
 * 简单的字符串哈希函数
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}

/**
 * 计算余弦相似度
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimension');
  }
  
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }
  
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);
  
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * 初始化向量存储
 */
export async function initVectorStore(dimension: number = 384): Promise<void> {
  try {
    await fs.mkdir(VECTORS_DIR, { recursive: true });
    
    try {
      const data = await fs.readFile(VECTORS_FILE, 'utf-8');
      vectorStore = JSON.parse(data);
    } catch {
      vectorStore = { vectors: [], dimension };
      await saveVectorStore();
    }
  } catch (error) {
    console.error('Failed to initialize vector store:', error);
    vectorStore = { vectors: [], dimension };
  }
}

/**
 * 保存向量存储到文件
 */
async function saveVectorStore(): Promise<void> {
  if (!vectorStore) return;
  
  await fs.mkdir(VECTORS_DIR, { recursive: true });
  await fs.writeFile(VECTORS_FILE, JSON.stringify(vectorStore), 'utf-8');
}

/**
 * 添加向量到存储
 */
export async function addVector(
  id: string,
  text: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  if (!vectorStore) {
    await initVectorStore();
  }
  
  const vector = textToVector(text, [], vectorStore!.dimension);
  
  // 检查是否已存在，如果存在则更新
  const existingIndex = vectorStore!.vectors.findIndex(v => v.id === id);
  if (existingIndex >= 0) {
    vectorStore!.vectors[existingIndex] = { id, vector, metadata };
  } else {
    vectorStore!.vectors.push({ id, vector, metadata });
  }
  
  await saveVectorStore();
}

/**
 * 批量添加向量
 */
export async function addVectors(
  items: Array<{ id: string; text: string; metadata?: Record<string, unknown> }>
): Promise<void> {
  if (!vectorStore) {
    await initVectorStore();
  }
  
  for (const item of items) {
    const vector = textToVector(item.text, [], vectorStore!.dimension);
    
    const existingIndex = vectorStore!.vectors.findIndex(v => v.id === item.id);
    if (existingIndex >= 0) {
      vectorStore!.vectors[existingIndex] = { id: item.id, vector, metadata: item.metadata };
    } else {
      vectorStore!.vectors.push({ id: item.id, vector, metadata: item.metadata });
    }
  }
  
  await saveVectorStore();
}

/**
 * 删除向量
 */
export async function removeVector(id: string): Promise<void> {
  if (!vectorStore) {
    await initVectorStore();
  }
  
  vectorStore!.vectors = vectorStore!.vectors.filter(v => v.id !== id);
  await saveVectorStore();
}

/**
 * 语义搜索
 */
export async function semanticSearch(
  query: string,
  limit: number = 10,
  threshold: number = 0.1
): Promise<Array<{ id: string; score: number; metadata?: Record<string, unknown> }>> {
  if (!vectorStore) {
    await initVectorStore();
  }
  
  const queryVector = textToVector(query, [], vectorStore!.dimension);
  
  const results = vectorStore!.vectors
    .map(entry => ({
      id: entry.id,
      score: cosineSimilarity(queryVector, entry.vector),
      metadata: entry.metadata,
    }))
    .filter(result => result.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  
  return results;
}

/**
 * 获取向量存储统计
 */
export async function getVectorStats(): Promise<{
  totalVectors: number;
  dimension: number;
  storageSize: number;
}> {
  if (!vectorStore) {
    await initVectorStore();
  }
  
  let storageSize = 0;
  try {
    const stats = await fs.stat(VECTORS_FILE);
    storageSize = stats.size;
  } catch {
    // 文件可能不存在
  }
  
  return {
    totalVectors: vectorStore!.vectors.length,
    dimension: vectorStore!.dimension,
    storageSize,
  };
}
