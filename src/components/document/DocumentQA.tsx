"use client";

import { useState } from 'react';
import { Send, Loader2, Bot } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DocumentQAProps {
    documentId: string;
}

export function DocumentQA({ documentId }: DocumentQAProps) {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAsk = async () => {
        if (!question.trim()) return;

        setIsLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/documents/${documentId}/qa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: question.trim() }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || '请求失败');
            }

            setAnswer(data.answer);
            setQuestion('');
        } catch (err: any) {
            setError(err.message || '发生未知错误');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAsk();
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mt-6">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-600" />
                <h3 className="font-medium text-gray-900">智能问答</h3>
            </div>

            <div className="p-4 space-y-4">
                {answer && (
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-start gap-3">
                            <div className="mt-1">
                                <Bot className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap flex-1">
                                {answer}
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                        {error}
                    </div>
                )}

                <div className="relative">
                    <textarea
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="关于这篇文档有什么疑问？"
                        className="w-full min-h-[100px] p-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none text-sm transition-colors text-gray-900 placeholder:text-gray-400"
                        disabled={isLoading}
                    />
                    <div className="absolute right-3 bottom-full mb-3 mr-3 shadow-md rounded-md z-10" />
                    <div className="flex justify-end mt-2">
                        <Button
                            size="sm"
                            onClick={handleAsk}
                            disabled={isLoading || !question.trim()}
                            className="gap-1.5 shadow-sm"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>思考中...</span>
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 text-white" />
                                    <span>发送</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
