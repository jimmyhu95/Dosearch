// 系统配置 API

import { NextRequest, NextResponse } from 'next/server';
import { getAllSettings, setSetting } from '@/lib/settings';
import { initializeDatabase } from '@/lib/db';

// 对外暴露的配置项定义
const SETTING_KEYS = ['dashscope_api_key', 'meilisearch_host', 'meilisearch_api_key'] as const;
type SettingKey = (typeof SETTING_KEYS)[number];

// 敏感 key 脱敏：保留前 8 位 + ***
function mask(value: string): string {
    if (!value || value.length <= 8) return value ? '********' : '';
    return value.slice(0, 8) + '***';
}

export async function GET() {
    try {
        initializeDatabase();
        const all = getAllSettings();

        const result: Record<string, { masked: string; configured: boolean }> = {};
        for (const key of SETTING_KEYS) {
            const val = all[key] ?? '';
            result[key] = { masked: mask(val), configured: val.length > 0 };
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
