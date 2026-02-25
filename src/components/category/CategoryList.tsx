'use client';

import Link from 'next/link';
import { 
  Code, Briefcase, GraduationCap, Scale, DollarSign,
  Package, Users, BookOpen, File, FolderOpen,
  type LucideProps
} from 'lucide-react';
import type { CategoryWithCount } from '@/types';

const categoryIcons: Record<string, React.ComponentType<LucideProps>> = {
  'technology': Code,
  'business': Briefcase,
  'academic': GraduationCap,
  'legal': Scale,
  'finance': DollarSign,
  'product': Package,
  'meeting': Users,
  'training': BookOpen,
  'other': File,
};

interface CategoryListProps {
  categories: CategoryWithCount[];
  layout?: 'grid' | 'list';
}

export function CategoryList({ categories, layout = 'grid' }: CategoryListProps) {
  if (layout === 'list') {
    return (
      <div className="space-y-2">
        {categories.map((category) => (
          <CategoryListItem key={category.id} category={category} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </div>
  );
}

function CategoryCard({ category }: { category: CategoryWithCount }) {
  const Icon = categoryIcons[category.slug] || FolderOpen;
  const iconColor = category.color || '#6B7280';

  return (
    <Link
      href={`/category/${category.slug}`}
      className="group block p-6 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${category.color}20` }}
        >
          <Icon className="w-6 h-6" color={iconColor} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {category.name}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {category.documentCount} 个文档
          </p>
        </div>
      </div>
      {category.description && (
        <p className="mt-3 text-sm text-gray-600 line-clamp-2">
          {category.description}
        </p>
      )}
    </Link>
  );
}

function CategoryListItem({ category }: { category: CategoryWithCount }) {
  const Icon = categoryIcons[category.slug] || FolderOpen;
  const iconColor = category.color || '#6B7280';

  return (
    <Link
      href={`/category/${category.slug}`}
      className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${category.color}20` }}
      >
        <Icon className="w-5 h-5" color={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900">{category.name}</h3>
        {category.description && (
          <p className="text-sm text-gray-500 truncate">{category.description}</p>
        )}
      </div>
      <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
        {category.documentCount}
      </span>
    </Link>
  );
}
