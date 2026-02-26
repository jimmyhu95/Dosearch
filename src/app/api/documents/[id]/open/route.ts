import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { documents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { exec } from 'child_process';
import os from 'os';

export async function POST(
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
        const platform = os.platform();

        let command = '';

        if (platform === 'win32') {
            command = `explorer /select,"${filePath}"`;
        } else if (platform === 'darwin') {
            command = `open -R "${filePath}"`;
        } else {
            command = `xdg-open "${filePath.substring(0, filePath.lastIndexOf('/'))}"`;
        }

        return new Promise<NextResponse>((resolve) => {
            exec(command, (error) => {
                // explorer.exe /select often returns an error code (usually 1) even when it successfully opens the folder.
                // We ignore the error on Windows to avoid false negative alerts.
                if (error && platform !== 'win32') {
                    console.error('Open location error:', error);
                    resolve(NextResponse.json({ success: false, error: '打开文件所在位置失败' }, { status: 500 }));
                } else {
                    resolve(NextResponse.json({ success: true }));
                }
            });
        });
    } catch (error) {
        console.error('Open Location API error:', error);
        return NextResponse.json(
            { success: false, error: '打开文件所在位置失败' },
            { status: 500 }
        );
    }
}
