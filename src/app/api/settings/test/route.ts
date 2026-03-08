// 连接测试 API — 使用 OpenAI 兼容端点

import { NextRequest, NextResponse } from 'next/server';
import { getSetting } from '@/lib/settings';
import { initializeDatabase } from '@/lib/db';

const CHAT_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

async function testDashScope(apiKey: string) {
    if (!apiKey) {
        return { success: false, error: '未配置 API Key，请先填写并保存' };
    }

    let lastError = '';

    // 网络层偶尔出现 TLS 握手慢导致 AbortError / ECONNRESET，加入 1 次重试防御
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
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
                signal: AbortSignal.timeout(20_000), // 放宽：10s -> 20s
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
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            lastError = msg;

            // 如果是因为网络原因（Timeout 导致 AbortError，或者 ECONNRESET 等）
            // 且是第一次尝试，则重试一次
            const isNetworkBlock = msg.includes('timeout') || msg.includes('ECONNRESET') || msg.includes('aborted');
            if (isNetworkBlock && attempt === 1) {
                console.warn(`[testDashScope] 网络握手异常，1s 后重试... (${msg})`);
                await new Promise(r => setTimeout(r, 1000));
                continue;
            }

            // 如果非网络报错，或者第二次重试依旧失败，跳出并抛错
            break;
        }
    }

    return { success: false, error: `连接超时或网络异常（请确保设备能正常访问外网）：${lastError}` };
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

async function testPrivateLocal(baseUrl: string, apiKey: string, modelName: string) {
    if (!baseUrl) {
        return { success: false, error: '未配置 Private Base URL，请先填写并保存' };
    }

    // Ensure the base URL ends with /v1 to avoid 404 errors as requested
    let finalBaseUrl = baseUrl;
    if (!finalBaseUrl.endsWith('/v1') && !finalBaseUrl.includes('/v1/')) {
        finalBaseUrl = finalBaseUrl.replace(/\/$/, '') + '/v1';
    }

    const chatUrl = `${finalBaseUrl}/chat/completions`;
    const targetModel = modelName || 'qwen3.5-flash';

    try {
        const res = await fetch(chatUrl, {
            method: 'POST',
            headers: {
                ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: targetModel,
                messages: [{ role: 'user', content: 'hi' }],
                max_tokens: 10,
            }),
            signal: AbortSignal.timeout(5_000), // 5 seconds timeout as requested
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
    } catch (err: unknown) {
        return { success: false, error: `连接失败：无法访问该地址，请检查本地服务是否已启动或地址是否正确。(${String(err)})` };
    }
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

        if (type === 'private') {
            const baseUrl = body.baseUrl?.trim() || getSetting('private_base_url', 'http://127.0.0.1:8000/v1');
            const apiKey = body.apiKey?.trim() || getSetting('private_api_key', '');
            const modelName = body.modelName?.trim() || getSetting('private_model_name', '');

            const result = await testPrivateLocal(baseUrl, apiKey, modelName);
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
