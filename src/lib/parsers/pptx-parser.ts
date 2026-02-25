// PowerPoint 文档解析器 (PPTX)

import JSZip from 'jszip';
import fs from 'fs/promises';
import path from 'path';
import type { ParsedDocument, DocumentMetadata } from '@/types';

// 从 XML 中提取文本
function extractTextFromXml(xml: string): string {
  // 移除 XML 标签，保留文本内容
  // 匹配 <a:t> 标签中的文本（PowerPoint 文本节点）
  const textMatches = xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) || [];
  const texts = textMatches.map(match => {
    const content = match.replace(/<a:t[^>]*>/, '').replace(/<\/a:t>/, '');
    return content;
  });
  
  return texts.join(' ');
}

export async function parsePptx(filePath: string): Promise<ParsedDocument> {
  const buffer = await fs.readFile(filePath);
  const zip = await JSZip.loadAsync(buffer);
  
  const slideTexts: string[] = [];
  let slideCount = 0;
  
  // 遍历所有幻灯片
  const slideFiles = Object.keys(zip.files)
    .filter(name => name.match(/ppt\/slides\/slide\d+\.xml$/))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
      return numA - numB;
    });
  
  for (const slideFile of slideFiles) {
    const content = await zip.files[slideFile].async('string');
    const text = extractTextFromXml(content);
    
    if (text.trim()) {
      slideCount++;
      slideTexts.push(`[Slide ${slideCount}]\n${text.trim()}`);
    }
  }
  
  // 也提取备注
  const notesFiles = Object.keys(zip.files)
    .filter(name => name.match(/ppt\/notesSlides\/notesSlide\d+\.xml$/));
  
  const notesTexts: string[] = [];
  for (const notesFile of notesFiles) {
    const content = await zip.files[notesFile].async('string');
    const text = extractTextFromXml(content);
    if (text.trim()) {
      notesTexts.push(text.trim());
    }
  }
  
  let fullContent = slideTexts.join('\n\n');
  if (notesTexts.length > 0) {
    fullContent += '\n\n[Speaker Notes]\n' + notesTexts.join('\n');
  }
  
  const metadata: DocumentMetadata = {
    slideCount: slideFiles.length,
    wordCount: fullContent.split(/\s+/).filter(Boolean).length,
  };

  // 从文件名提取标题
  const title = path.basename(filePath, path.extname(filePath));

  return {
    title,
    content: fullContent,
    metadata,
  };
}
