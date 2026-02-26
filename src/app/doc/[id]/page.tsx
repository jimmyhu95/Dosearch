import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { DocumentMeta } from '@/components/document/DocumentMeta';
import { DocumentContent } from '@/components/document/DocumentContent';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { HighlightText } from '@/components/ui/HighlightText';
import { DocumentActions } from '@/components/document/DocumentActions';
import { DocumentQA } from '@/components/document/DocumentQA';
import type { DocumentWithCategories } from '@/types';
import { db } from '@/lib/db';
import { documents, documentCategories, categories, keywords } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}

// 获取文档数据 (基于 Server Component 直连 DB，避免内部 HTTP 套娃带来的 404 和网络开销)
async function getDocument(id: string): Promise<DocumentWithCategories | null> {
  const safeId = id.trim();
  try {
    const docQuery = await db.select().from(documents).where(eq(documents.id, safeId)).limit(1);

    if (docQuery.length === 0) return null;

    const rawDoc = docQuery[0];

    const docCategories = await db
      .select({
        categoryId: categories.id,
        categoryName: categories.name,
        categorySlug: categories.slug,
        confidence: documentCategories.confidence,
      })
      .from(documentCategories)
      .innerJoin(categories, eq(documentCategories.categoryId, categories.id))
      .where(eq(documentCategories.documentId, safeId));

    const docKeywords = await db
      .select()
      .from(keywords)
      .where(eq(keywords.documentId, safeId));

    return {
      ...rawDoc,
      createdAt: rawDoc.createdAt ? new Date(rawDoc.createdAt) : new Date(),
      modifiedAt: rawDoc.modifiedAt ? new Date(rawDoc.modifiedAt) : null,
      indexedAt: rawDoc.indexedAt ? new Date(rawDoc.indexedAt) : null,
      metadata: rawDoc.metadata ? (typeof rawDoc.metadata === 'string' ? JSON.parse(rawDoc.metadata) : rawDoc.metadata) : null,
      categories: docCategories,
      keywords: docKeywords,
    } as unknown as DocumentWithCategories;
  } catch (error) {
    console.error(`[DB Error] 无法获取文档 ${safeId}:`, error);
  }
  return null;
}

// 动态生成 SEO 元数据
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const doc = await getDocument(id);

  if (!doc) {
    return {
      title: '文档未找到',
    };
  }

  const keywords = doc.keywords?.map(k => k.keyword).join(', ') || '';

  return {
    title: doc.title,
    description: doc.summary || doc.content?.slice(0, 160) || '',
    keywords: keywords,
    openGraph: {
      title: doc.title,
      description: doc.summary || '',
      type: 'article',
    },
  };
}

export default async function DocumentPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams?.q || '';
  const doc = await getDocument(id);

  if (!doc) {
    notFound();
  }

  // JSON-LD 结构化数据
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: doc.title,
    description: doc.summary || '',
    datePublished: doc.createdAt,
    dateModified: doc.modifiedAt || doc.createdAt,
    keywords: doc.keywords?.map(k => k.keyword).join(', '),
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link
            href="/search"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回搜索
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 主内容区 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 标题 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                <HighlightText text={doc.title} keyword={q} />
              </h1>

              {/* 操作按钮 */}
              <DocumentActions id={doc.id} />
            </div>

            {/* 文档内容 */}
            <DocumentContent
              content={doc.content}
              summary={doc.summary}
              keyword={q}
            />
          </div>

          {/* 侧边栏 */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <DocumentMeta document={doc} />
              <DocumentQA documentId={doc.id} />
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
