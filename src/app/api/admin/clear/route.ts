// 清除数据 API

import { NextRequest, NextResponse } from 'next/server';
import { getRawDb, initializeDatabase } from '@/lib/db';
import { checkMeiliHealth, getMeiliClient, DOCUMENTS_INDEX } from '@/lib/search/meilisearch';

export async function DELETE(request: NextRequest) {
    try {
        initializeDatabase();
        const { searchParams } = request.nextUrl;
        const target = searchParams.get('target') ?? 'all'; // 'history' | 'all'

        const db = getRawDb();

        if (target === 'history') {
            // 仅清除扫描历史
            const info = db.prepare('DELETE FROM scan_history').run();
            return NextResponse.json({ success: true, message: `已清除 ${info.changes} 条扫描历史` });
        }

        // target === 'all'：清除所有文档数据 + 扫描历史
        db.prepare('DELETE FROM keywords').run();
        db.prepare('DELETE FROM document_categories').run();
        db.prepare('DELETE FROM documents').run();
        db.prepare('DELETE FROM categories').run(); // 清除旧分类，下一次请求将重新初始化 10 个新分类
        const historyInfo = db.prepare('DELETE FROM scan_history').run();

        // 同步清除 MeiliSearch 索引
        let meiliCleared = false;
        try {
            const healthy = await checkMeiliHealth();
            if (healthy) {
                const client = getMeiliClient();
                await client.deleteIndex(DOCUMENTS_INDEX);
                meiliCleared = true;
            }
        } catch {
            // MeiliSearch 不可用时忽略
        }

        return NextResponse.json({
            success: true,
            message: `已清除所有文档记录（${historyInfo.changes} 条历史）${meiliCleared ? '，搜索索引已重置' : ''}`,
        });
    } catch (error) {
        console.error('Clear API error:', error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
