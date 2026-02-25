// 分类类型定义

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  icon: string | null;
  color: string | null;
  sortOrder: number;
}

export interface CategoryWithCount extends Category {
  documentCount: number;
  children?: CategoryWithCount[];
}

export interface CategoryTree extends Category {
  children: CategoryTree[];
}

export interface CategoryCreateInput {
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
}

// 预定义的分类
export const DEFAULT_CATEGORIES: CategoryCreateInput[] = [
  { name: '技术文档', slug: 'technology', icon: 'code', color: '#3B82F6', sortOrder: 1 },
  { name: '商业报告', slug: 'business', icon: 'briefcase', color: '#10B981', sortOrder: 2 },
  { name: '学术论文', slug: 'academic', icon: 'graduation-cap', color: '#8B5CF6', sortOrder: 3 },
  { name: '法律文件', slug: 'legal', icon: 'scale', color: '#F59E0B', sortOrder: 4 },
  { name: '财务报表', slug: 'finance', icon: 'dollar-sign', color: '#EF4444', sortOrder: 5 },
  { name: '产品文档', slug: 'product', icon: 'package', color: '#EC4899', sortOrder: 6 },
  { name: '会议记录', slug: 'meeting', icon: 'users', color: '#06B6D4', sortOrder: 7 },
  { name: '培训资料', slug: 'training', icon: 'book-open', color: '#84CC16', sortOrder: 8 },
  { name: '其他', slug: 'other', icon: 'file', color: '#6B7280', sortOrder: 99 },
];
