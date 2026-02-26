'use client';

import { Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function DocumentActions({ id }: { id: string }) {
    const handleDownload = () => {
        window.location.href = `/api/documents/${id}/download`;
    };

    const handleOpenLocation = async () => {
        try {
            const res = await fetch(`/api/documents/${id}/open`, { method: 'POST' });
            const data = await res.json();
            if (!data.success) {
                console.error(data.error || '打开文件位置失败');
            }
        } catch (err) {
            console.error('操作失败', err);
        }
    };

    return (
        <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                下载原文件
            </Button>
            <Button variant="outline" size="sm" onClick={handleOpenLocation}>
                <ExternalLink className="w-4 h-4 mr-2" />
                打开文件位置
            </Button>
        </div>
    );
}
