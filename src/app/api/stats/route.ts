// 统计 API

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { documents, categories, keywords, scanHistory } from '@/lib/db/schema';
import { sql, desc } from 'drizzle-orm';

export async function GET() {
  try {
    // 文档总数
    const docCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(documents);

    // 分类总数
    const catCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(categories);

    // 关键词总数
    const kwCount = await db
      .select({ count: sql<number>`count(distinct ${keywords.keyword})` })
      .from(keywords);

    // 按文件类型统计
    const docsByType = await db
      .select({
        fileType: documents.fileType,
        count: sql<number>`count(*)`,
      })
      .from(documents)
      .groupBy(documents.fileType);

    // 最近一次扫描
    const lastScan = await db
      .select()
      .from(scanHistory)
      .orderBy(desc(scanHistory.startedAt))
      .limit(1);

    // 存储使用量（文件总大小）
    const storageResult = await db
      .select({ total: sql<number>`sum(${documents.fileSize})` })
      .from(documents);

    const stats = {
      totalDocuments: docCount[0]?.count || 0,
      totalCategories: catCount[0]?.count || 0,
      totalKeywords: kwCount[0]?.count || 0,
      storageUsed: storageResult[0]?.total || 0,
      lastScanAt: lastScan[0]?.startedAt ? new Date(lastScan[0].startedAt) : null,
      documentsByType: Object.fromEntries(
        docsByType.map(item => [item.fileType, item.count])
      ),
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { success: false, error: '获取统计信息失败' },
      { status: 500 }
    );
  }
}
