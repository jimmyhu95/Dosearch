import Link from 'next/link';
import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CategoryList } from '@/components/category/CategoryList';
import type { CategoryWithCount } from '@/types';

export const metadata: Metadata = {
  title: '文档分类',
  description: '浏览所有文档分类，快速找到您需要的文档类型。',
};

import { db, initializeDatabase } from '@/lib/db';
import { documentCategories } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import { CATEGORY_DEFINITIONS } from '@/lib/classifier/categories';

async function getCategories(): Promise<CategoryWithCount[]> {
  try {
    initializeDatabase();

    const rows = await db
      .select({
        categoryId: documentCategories.categoryId,
        count: sql<number>`count(${documentCategories.documentId})`,
      })
      .from(documentCategories)
      .groupBy(documentCategories.categoryId);

    const countMap = new Map<string, number>();
    rows.forEach(r => countMap.set(r.categoryId, Number(r.count)));

    return CATEGORY_DEFINITIONS.map(def => ({
      id: def.id,
      name: def.name,
      slug: def.slug,
      description: def.description,
      parentId: null,
      icon: def.icon,
      color: def.color,
      sortOrder: 0,
      documentCount: countMap.get(def.id) || 0,
    }));
  } catch (error) {
    console.error('Failed to get categories from DB:', error);
    return CATEGORY_DEFINITIONS.map(def => ({
      id: def.id,
      name: def.name,
      slug: def.slug,
      description: def.description,
      parentId: null,
      icon: def.icon,
      color: def.color,
      sortOrder: 0,
      documentCount: 0,
    }));
  }
}

export const dynamic = 'force-dynamic';

export default async function CategoryIndexPage() {
  const categories = await getCategories();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">文档分类</h1>
          <p className="text-gray-600">
            浏览所有文档分类，快速找到您需要的文档类型
          </p>
        </div>

        {categories.length > 0 ? (
          <CategoryList categories={categories} layout="grid" />
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="text-6xl mb-4">📁</div>
            <h2 className="text-xl font-medium text-gray-900 mb-2">暂无分类</h2>
            <p className="text-gray-500 mb-6">
              扫描文档后将自动创建分类
            </p>
            <Link
              href="/admin"
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              开始扫描
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
