// 系统配置 API

import { NextRequest, NextResponse } from 'next/server';
import { getAllSettings, setSetting } from '@/lib/settings';
import { initializeDatabase } from '@/lib/db';

// 对外暴露的配置项定义
const SETTING_KEYS = [
    'api_mode',
    'private_base_url',
    'private_api_key',
    'private_model_name',
    'dashscope_api_key',
    'meilisearch_host',
    'meilisearch_api_key'
] as const;
type SettingKey = (typeof SETTING_KEYS)[number];

// 敏感 key 脱敏：保留前 8 位 + ***
function mask(value: string, key: string): string {
    const nonSensitive = ['api_mode', 'private_base_url', 'private_model_name', 'meilisearch_host'];
    if (nonSensitive.includes(key)) return value;
    if (!value || value.length <= 8) return value ? '********' : '';
    return value.slice(0, 8) + '***';
}

export async function GET() {
    try {
        initializeDatabase();
        const all = getAllSettings();

        const result: Record<string, { masked: string; configured: boolean; raw?: string }> = {};
        for (const key of SETTING_KEYS) {
            const val = all[key] ?? '';
            result[key] = {
                masked: mask(val, key),
                configured: val.length > 0,
                ...(['api_mode', 'private_base_url', 'private_model_name', 'meilisearch_host'].includes(key) ? { raw: val } : {})
            };
        }

        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        initializeDatabase();
        const body = await request.json();

        const updated: string[] = [];
        for (const key of SETTING_KEYS) {
            if (key in body && typeof body[key] === 'string') {
                // 空字符串表示清除
                setSetting(key, body[key]);
                updated.push(key);
            }
        }

        return NextResponse.json({ success: true, updated });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
