// 搜索建议 API

import { NextRequest, NextResponse } from 'next/server';
import { getSearchSuggestions } from '@/lib/search';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        suggestions: [],
      });
    }

    const suggestions = await getSearchSuggestions(query, limit);

    return NextResponse.json({
      success: true,
      suggestions,
    });
  } catch (error) {
    console.error('Suggestions error:', error);
    return NextResponse.json({
      success: true,
      suggestions: [],
    });
  }
}
