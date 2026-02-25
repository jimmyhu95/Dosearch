// 分类 API

import { NextRequest, NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import { categories, documentCategories } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { initializeCategories } from '@/lib/scanner';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    initializeDatabase();
    await initializeCategories(); // 确保 CATEGORY_DEFINITIONS 中的新分类自动同步到 DB
    // 获取所有分类及其文档数量
    const categoriesWithCount = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        parentId: categories.parentId,
        icon: categories.icon,
        color: categories.color,
        sortOrder: categories.sortOrder,
        documentCount: sql<number>`count(${documentCategories.documentId})`,
      })
      .from(categories)
      .leftJoin(documentCategories, eq(categories.id, documentCategories.categoryId))
      .groupBy(categories.id)
      .orderBy(categories.sortOrder);

    return NextResponse.json({
      success: true,
      data: categoriesWithCount,
    });
  } catch (error) {
    console.error('Categories API error:', error);
    return NextResponse.json(
      { success: false, error: '获取分类失败' },
      { status: 500 }
    );
  }
}
