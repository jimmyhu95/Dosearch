// 文档列表 API

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { documents, documentCategories, categories, keywords } from '@/lib/db/schema';
import { eq, desc, asc, inArray, sql, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const fileType = searchParams.get('fileType');
    const category = searchParams.get('category'); // category id / slug

    const offset = (page - 1) * limit;

    // 构建过滤条件
    const conditions = [];

    if (fileType) {
      conditions.push(eq(documents.fileType, fileType));
    }

    if (category) {
      // 先查出属于该分类的文档 ID
      const docIdsInCategory = await db
        .select({ id: documentCategories.documentId })
        .from(documentCategories)
        .where(eq(documentCategories.categoryId, category));

      if (docIdsInCategory.length === 0) {
        return NextResponse.json({
          success: true,
          data: { items: [], total: 0, page, limit, totalPages: 0 },
        });
      }

      conditions.push(inArray(documents.id, docIdsInCategory.map((d) => d.id)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const orderColumn = sortBy === 'title' ? documents.title : documents.createdAt;
    const orderExpr = sortOrder === 'asc' ? asc(orderColumn) : desc(orderColumn);

    const docs = await db
      .select()
      .from(documents)
      .where(whereClause)
      .orderBy(orderExpr)
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(documents)
      .where(whereClause);
    const total = countResult[0]?.count || 0;

    // 关联分类和关键词
    const docsWithRelations = await Promise.all(
      docs.map(async (doc) => {
        const docCategories = await db
          .select({
            categoryId: categories.id,
            categoryName: categories.name,
            categorySlug: categories.slug,
            confidence: documentCategories.confidence,
          })
          .from(documentCategories)
          .innerJoin(categories, eq(documentCategories.categoryId, categories.id))
          .where(eq(documentCategories.documentId, doc.id));

        const docKeywords = await db
          .select()
          .from(keywords)
          .where(eq(keywords.documentId, doc.id))
          .limit(10);

        return {
          ...doc,
          createdAt: new Date(doc.createdAt),
          modifiedAt: doc.modifiedAt ? new Date(doc.modifiedAt) : null,
          indexedAt: doc.indexedAt ? new Date(doc.indexedAt) : null,
          metadata: doc.metadata ? JSON.parse(doc.metadata as string) : null,
          categories: docCategories,
          keywords: docKeywords,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        items: docsWithRelations,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Documents API error:', error);
    return NextResponse.json(
      { success: false, error: '获取文档列表失败' },
      { status: 500 }
    );
  }
}
