// 连接测试 API — 使用 OpenAI 兼容端点

import { NextRequest, NextResponse } from 'next/server';
import { getSetting } from '@/lib/settings';
import { initializeDatabase } from '@/lib/db';

const CHAT_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

async function testDashScope(apiKey: string) {
    if (!apiKey) {
        return { success: false, error: '未配置 API Key，请先填写并保存' };
    }
    const res = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'qwen3.5-flash',
            messages: [{ role: 'user', content: '你好' }],
            max_tokens: 5,
        }),
        signal: AbortSignal.timeout(10_000),
    });

    if (res.status === 401 || res.status === 403) {
        return { success: false, error: `API Key 无效或无权限（HTTP ${res.status}）` };
    }
    if (!res.ok) {
        const text = await res.text();
        return { success: false, error: `请求失败（HTTP ${res.status}）: ${text.slice(0, 200)}` };
    }
    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content ?? '（无回复内容）';
    return { success: true, message: `连接成功，模型回复：${reply.slice(0, 50)}` };
}

async function testMeiliSearch(host: string) {
    if (!host) return { success: false, error: '未指定 MeiliSearch 地址' };
    const res = await fetch(host.replace(/\/$/, '') + '/health', {
        signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return { success: false, error: `健康检查失败（HTTP ${res.status}）` };
    const data = await res.json();
    const status = data?.status ?? '未知';
    return {
        success: status === 'available',
        message: status === 'available' ? `MeiliSearch 连接正常（${host}）` : `服务状态异常：${status}`,
        error: status !== 'available' ? `服务状态：${status}` : undefined,
    };
}

export async function POST(request: NextRequest) {
    try {
        initializeDatabase();
        const body = await request.json().catch(() => ({}));
        const type: string = body.type ?? 'dashscope';

        if (type === 'meilisearch') {
            const host =
                body.host?.trim() ||
                getSetting('meilisearch_host', process.env.MEILISEARCH_HOST || 'http://localhost:7700');
            const result = await testMeiliSearch(host);
            return NextResponse.json(result, { status: result.success ? 200 : 400 });
        }

        const apiKey: string =
            body.apiKey?.trim() ||
            getSetting('dashscope_api_key', process.env.DASHSCOPE_API_KEY || '');
        const result = await testDashScope(apiKey);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ success: false, error: `请求异常：${msg}` }, { status: 500 });
    }
}
