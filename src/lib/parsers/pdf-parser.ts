// PDF 文档解析器 — 三层解析链：pdfjs-dist → pdf-parse → 文件名兜底

import fs from 'fs/promises';
import path from 'path';
import { pathToFileURL } from 'url';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { ParsedDocument } from '@/types';

// 禁用 pdfjs worker（Node.js 服务端环境）
pdfjs.GlobalWorkerOptions.workerSrc = '';

// ─── Tier 1：pdfjs-dist/legacy ───────────────────────────────────────────────
async function parseWithPdfjs(dataBuffer: Buffer): Promise<{ text: string; pageCount: number }> {
  const pdfJsDir = path.dirname(require.resolve('pdfjs-dist/package.json'));
  // 将系统路径转为 file:// URL，避免 Windows 反斜杠导致 pdfjs URL 校验失败
  const cMapUrl = pathToFileURL(path.join(pdfJsDir, 'cmaps')).href + '/';
  const standardFontDataUrl = pathToFileURL(path.join(pdfJsDir, 'standard_fonts')).href + '/';

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(dataBuffer),
    cMapUrl,
    cMapPacked: true,
    standardFontDataUrl,
    disableFontFace: true,
    // 对私有字体/非标准 CID 映射的容错
    useSystemFonts: true,
    isEvalSupported: false,
    verbosity: 0,
  });

  const pdfDocument = await loadingTask.promise;
  const pageCount = pdfDocument.numPages;
  let text = '';

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdfDocument.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => item.str).join(' ') + '\n';
  }

  return { text, pageCount };
}

// ─── Tier 2：pdf-parse（内置 pdfjs 2.x，独立引擎作为真实冗余）────────────────
async function parseWithPdfParse(dataBuffer: Buffer): Promise<{ text: string; pageCount: number }> {
  // 动态导入，避免在 Tier 1 成功时产生开销
  const pdfParse = (await import('pdf-parse')) as any;
  const result = await (pdfParse.default || pdfParse)(dataBuffer);
  return { text: result.text, pageCount: result.numpages };
}

// ─── 主入口 ──────────────────────────────────────────────────────────────────
export async function parsePdf(filePath: string): Promise<ParsedDocument> {
  const fileName = path.basename(filePath, path.extname(filePath));
  const dataBuffer = await fs.readFile(filePath);

  let detectedPageCount = 0;

  // Tier 1: pdfjs-dist/legacy (现代引擎)
  try {
    const { text, pageCount } = await parseWithPdfjs(dataBuffer);
    detectedPageCount = pageCount;
    if (text.trim().length < 50) {
      throw new Error('Tier 1 提取纯文本过短，抛出以触发 catch 块流转');
    }

    return {
      title: fileName,
      content: text,
      metadata: { parser: 'pdfjs-v5', pageCount, wordCount: text.split(/\s+/).filter(Boolean).length } as any,
    };
  } catch (err1) {
    console.warn(`[PDF Parser] Tier1(pdfjs) 失败，转入 Tier 2: ${fileName} | ${(err1 as Error).message}`);
  }

  // Tier 2: pdf-parse (兼容引擎)
  try {
    const { text, pageCount } = await parseWithPdfParse(dataBuffer);
    detectedPageCount = detectedPageCount || pageCount;
    if (text.trim().length < 50) {
      throw new Error('Tier 2 提取纯文本过短，抛出以触发 catch 块阻断');
    }

    return {
      title: fileName,
      content: text,
      metadata: { parser: 'pdf-parse-fallback', pageCount, wordCount: text.split(/\s+/).filter(Boolean).length } as any,
    };
  } catch (err2) {
    console.warn(`[PDF Parser] 本地双引擎均未提取到有效文本，触发最终文件名兜底: ${fileName} | ${(err2 as Error).message}`);
  }

  // Tier 3: 文件名终极兜底
  return {
    title: fileName,
    content: `【系统提示：未提取到有效文本，该文件可能为纯图片或扫描版 PDF，已降级为仅保留文件名索引】文件原名：${fileName}`,
    metadata: { parser: 'fallback-filename-only', error: 'all-tiers-failed' } as any,
  };
}
