/**
 * AI 智能分类文档（qwen3.5-plus）
 */
export declare function aiClassifyDocument(content: string, title?: string): Promise<{
    categories: Array<{
        id: string;
        name: string;
        confidence: number;
    }>;
    keywords: string[];
    summary: string;
}>;
/**
 * AI 生成文档摘要（qwen3.5-plus）
 */
export declare function aiGenerateSummary(content: string, maxLength?: number): Promise<string>;
/**
 * AI 提取关键词（qwen3.5-flash）
 */
export declare function aiExtractKeywords(content: string, count?: number): Promise<string[]>;
/**
 * AI 智能问答（qwen3.5-plus）
 */
export declare function aiDocumentQA(content: string, question: string): Promise<string>;
/**
 * 图片内容识别（qwen3-vl-plus）
 * base64Data: 纯 base64 字符串，mimeType: 如 image/png
 */
export declare function analyzeImage(base64Data: string, mimeType: string): Promise<string>;
