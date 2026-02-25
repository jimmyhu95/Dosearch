// 分类详情页 — 直接查询 DB，规避 Server Component SSR 内 localhost HTTP 竞争问题

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { DocumentCard } from '@/components/document/DocumentCard';
import { CategoryPagination } from './CategoryPagination';
import { db, initializeDatabase } from '@/lib/db';
import { documents, documentCategories } from '@/lib/db/schema';
import { eq, sql, desc } from 'drizzle-orm';
import type { CategoryWithCount, DocumentWithCategories } from '@/types';
import { CATEGORY_DEFINITIONS } from '@/lib/classifier/categories';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

const PAGE_SIZE = 20;

async function getCategoryBySlug(slug: string): Promise<CategoryWithCount | null> {
  const def = CATEGORY_DEFINITIONS.find(c => c.slug === slug);
  if (!def) return null;

  initializeDatabase();
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(documentCategories)
    .where(eq(documentCategories.categoryId, def.id));

  return {
    id: def.id,
    name: def.name,
    slug: def.slug,
    description: def.description,
    parentId: null,
    icon: def.icon,
    color: def.color,
    sortOrder: 0,
    documentCount: Number(count),
  };
}

async function getCategoryDocuments(
  categoryId: string,
  categoryName: string,
  slug: string,
  page: number
): Promise<{ items: DocumentWithCategories[]; total: number; totalPages: number }> {
  const offset = (page - 1) * PAGE_SIZE;

  // 总数
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(documentCategories)
    .where(eq(documentCategories.categoryId, categoryId));

  // 文档列表（含分类和关键词关联）
  const rows = await db
    .select({
      id: documents.id,
      title: documents.title,
      filePath: documents.filePath,
      fileType: documents.fileType,
      fileSize: documents.fileSize,
      summary: documents.summary,
      createdAt: documents.createdAt,
      modifiedAt: documents.modifiedAt,
      fileHash: documents.fileHash,
      metadata: documents.metadata,
      indexedAt: documents.indexedAt,
    })
    .from(documents)
    .innerJoin(documentCategories, eq(documents.id, documentCategories.documentId))
    .where(eq(documentCategories.categoryId, categoryId))
    .orderBy(desc(documents.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  // 为每个文档附加分类和关键词，并格式化 Date 为字符串避免序列化错误
  const items: DocumentWithCategories[] = rows.map((row) => ({
    ...row,
    fileType: row.fileType as any,
    metadata: row.metadata as any,
    content: null,
    indexedAt: row.indexedAt ? new Date(row.indexedAt).toISOString() as any : null,
    createdAt: new Date(row.createdAt).toISOString() as any,
    modifiedAt: row.modifiedAt ? new Date(row.modifiedAt).toISOString() as any : null,
    categories: [{ categoryId, categoryName: categoryName || '', categorySlug: slug, confidence: 1 }],
    keywords: [],
  }));

  return {
    items,
    total: Number(total),
    totalPages: Math.ceil(Number(total) / PAGE_SIZE),
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: '分类未找到' };
  return {
    title: `${category.name} - 文档分类`,
    description: category.description || `浏览 ${category.name} 分类下的所有文档`,
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || '1'));

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const { items: documents, total, totalPages } = await getCategoryDocuments(category.id, category.name, slug, page);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* 分类头部 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: `${category.color}20` }}
            >
              📁
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
              <p className="text-gray-600">{total} 个文档</p>
            </div>
          </div>
          {category.description && (
            <p className="text-gray-600">{category.description}</p>
          )}
        </div>

        {/* 文档列表 */}
        {documents.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <DocumentCard key={doc.id} document={doc} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8">
                <CategoryPagination
                  slug={slug}
                  currentPage={page}
                  totalPages={totalPages}
                />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="text-6xl mb-4">📄</div>
            <h2 className="text-xl font-medium text-gray-900 mb-2">暂无文档</h2>
            <p className="text-gray-500">该分类下还没有文档</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
