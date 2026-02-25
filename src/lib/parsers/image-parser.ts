// 图片文件解析器 — 调用 ai-service.ts 中统一的视觉模型接口

import fs from 'fs/promises';
import path from 'path';
import { analyzeImage } from '../classifier/ai-service';
import type { ParsedDocument } from '@/types';

const SUPPORTED_MIME: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
};

/**
 * 解析图片文件 — 读取为 base64 后交由 analyzeImage 识别
 */
export async function parseImage(filePath: string): Promise<ParsedDocument> {
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = SUPPORTED_MIME[ext] ?? 'image/png';
    const fileName = path.basename(filePath, ext);

    const buffer = await fs.readFile(filePath);
    const base64 = buffer.toString('base64');

    let content = '';
    try {
        content = await analyzeImage(base64, mimeType);
    } catch (error) {
        console.warn(`Image analysis failed for ${filePath}:`, error);
        content = `（图片识别失败：${error instanceof Error ? error.message : String(error)}）`;
    }

    return {
        title: fileName,
        content,
        metadata: {
            imageType: mimeType,
            fileSizeBytes: buffer.byteLength,
        },
    };
}
