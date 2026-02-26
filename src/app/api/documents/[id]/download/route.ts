import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { documents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const doc = await db
            .select({ filePath: documents.filePath })
            .from(documents)
            .where(eq(documents.id, id))
            .limit(1);

        if (doc.length === 0) {
            return NextResponse.json({ success: false, error: '文档不存在' }, { status: 404 });
        }

        const filePath = doc[0].filePath;

        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ success: false, error: '本地文件不存在' }, { status: 404 });
        }

        const filename = path.basename(filePath);

        // 使用 Web ReadableStream 返回文件流
        const fileStream = fs.createReadStream(filePath);
        const readableStream = new ReadableStream({
            start(controller) {
                fileStream.on('data', (chunk) => controller.enqueue(chunk));
                fileStream.on('end', () => controller.close());
                fileStream.on('error', (err) => controller.error(err));
            }
        });

        return new NextResponse(readableStream, {
            headers: {
                'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
                'Content-Type': 'application/octet-stream',
            },
        });
    } catch (error) {
        console.error('Download API error:', error);
        return NextResponse.json(
            { success: false, error: '文件下载失败' },
            { status: 500 }
        );
    }
}
