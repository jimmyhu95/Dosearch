// 单个文档 API

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { documents, documentCategories, categories, keywords } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 获取文档
    const doc = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);

    if (doc.length === 0) {
      return NextResponse.json(
        { success: false, error: '文档不存在' },
        { status: 404 }
      );
    }

    // 获取分类
    const docCategories = await db
      .select({
        categoryId: categories.id,
        categoryName: categories.name,
        categorySlug: categories.slug,
        confidence: documentCategories.confidence,
      })
      .from(documentCategories)
      .innerJoin(categories, eq(documentCategories.categoryId, categories.id))
      .where(eq(documentCategories.documentId, id));

    // 获取关键词
    const docKeywords = await db
      .select()
      .from(keywords)
      .where(eq(keywords.documentId, id));

    const document = {
      ...doc[0],
      createdAt: new Date(doc[0].createdAt),
      modifiedAt: doc[0].modifiedAt ? new Date(doc[0].modifiedAt) : null,
      indexedAt: doc[0].indexedAt ? new Date(doc[0].indexedAt) : null,
      metadata: doc[0].metadata ? JSON.parse(doc[0].metadata as string) : null,
      categories: docCategories,
      keywords: docKeywords,
    };

    return NextResponse.json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error('Document API error:', error);
    return NextResponse.json(
      { success: false, error: '获取文档失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 删除文档（关联数据会自动级联删除）
    await db.delete(documents).where(eq(documents.id, id));

    return NextResponse.json({
      success: true,
      message: '文档已删除',
    });
  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json(
      { success: false, error: '删除文档失败' },
      { status: 500 }
    );
  }
}
