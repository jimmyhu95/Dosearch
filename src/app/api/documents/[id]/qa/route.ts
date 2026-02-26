import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { documents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { aiDocumentQA } from '@/lib/classifier/ai-service';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { question } = await req.json();

        if (!question || typeof question !== 'string') {
            return NextResponse.json({ error: '无效的问题' }, { status: 400 });
        }

        const docQuery = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
        if (docQuery.length === 0) {
            return NextResponse.json({ error: '文档未找到' }, { status: 404 });
        }

        const doc = docQuery[0];

        if (!doc.content) {
            return NextResponse.json({ error: '文档内容为空' }, { status: 400 });
        }

        const answer = await aiDocumentQA(doc.content, question);
        return NextResponse.json({ answer });
    } catch (error) {
        console.error('[QA API Error]', error);
        return NextResponse.json({ error: '处理问答请求失败' }, { status: 500 });
    }
}
