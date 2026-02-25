'use client';

import { Suspense } from 'react';
import { SearchPageContent } from './SearchPageContent';

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">加载中...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
