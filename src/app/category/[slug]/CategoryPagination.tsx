'use client';

// Client Component 薄包装：将 useRouter 导航封装在客户端，
// 使 Server Component category/[slug]/page.tsx 无需传递函数引用
import { useRouter } from 'next/navigation';
import { Pagination } from '@/components/search/Pagination';

interface CategoryPaginationProps {
  slug: string;
  currentPage: number;
  totalPages: number;
}

export function CategoryPagination({ slug, currentPage, totalPages }: CategoryPaginationProps) {
  const router = useRouter();
  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={(page) => router.push(`/category/${slug}?page=${page}`)}
    />
  );
}
