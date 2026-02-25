// 扫描 API

import { NextRequest, NextResponse } from 'next/server';
import { scanFolder, getScanHistory } from '@/lib/scanner';
import { initializeDatabase } from '@/lib/db';

// 允许扫描运行最多 5 分钟
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    initializeDatabase();
    const body = await request.json();
    const { path: scanPath, options = {} } = body;

    if (!scanPath) {
      return NextResponse.json(
        { success: false, error: '请指定扫描路径' },
        { status: 400 }
      );
    }

    const result = await scanFolder(scanPath, {
      recursive: options.recursive ?? true,
      includeHidden: options.includeHidden ?? false,
      fileTypes: options.fileTypes,
      excludePatterns: options.excludePatterns,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Scan API error:', error);
    return NextResponse.json(
      { success: false, error: '扫描失败: ' + (error instanceof Error ? error.message : '未知错误') },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    initializeDatabase();
    const history = await getScanHistory(20);

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Scan history API error:', error);
    return NextResponse.json(
      { success: false, error: '获取扫描历史失败' },
      { status: 500 }
    );
  }
}
