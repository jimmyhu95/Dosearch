import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { documents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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

        try {
            await execAsync(command);
        } catch (err) {
            // explorer.exe /select 在成功时也常返回非零退出码，Windows 下忽略
            if (platform !== 'win32') {
                console.error('Open location error:', err);
                return NextResponse.json({ success: false, error: '打开文件所在位置失败' }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Open Location API error:', error);
        return NextResponse.json(
            { success: false, error: '打开文件所在位置失败' },
            { status: 500 }
        );
    }
}
