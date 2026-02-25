// 搜索 API

import { NextRequest, NextResponse } from 'next/server';
import { hybridSearch, getSearchSuggestions } from '@/lib/search';
import type { SearchQuery, SearchMode } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const query: SearchQuery = {
      q: searchParams.get('q') || '',
      mode: (searchParams.get('mode') as SearchMode) || 'hybrid',
      categories: searchParams.get('categories')?.split(',').filter(Boolean),
      fileTypes: searchParams.get('fileTypes')?.split(',').filter(Boolean),
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: (searchParams.get('sortBy') as 'relevance' | 'date' | 'title') || 'relevance',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    };

    if (!query.q) {
      return NextResponse.json(
        { success: false, error: '搜索关键词不能为空' },
        { status: 400 }
      );
    }

    const results = await hybridSearch(query);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { success: false, error: '搜索失败，请稍后重试' },
      { status: 500 }
    );
  }
}
