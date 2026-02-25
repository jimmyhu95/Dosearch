// 阿里云百炼 AI 服务 — 使用 OpenAI 兼容端点（/compatible-mode/v1）
// 统一 text/vision 模型调用，无需区分两套请求路由

import { getSetting } from '@/lib/settings';

const BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const CHAT_URL = `${BASE_URL}/chat/completions`;

// OpenAI 兼容的消息格式
type TextContent = { type: 'text'; text: string };
type ImageContent = { type: 'image_url'; image_url: { url: string } };
type MessageContent = string | Array<TextContent | ImageContent>;

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: MessageContent;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * 统一 chat 调用（文本 + 视觉模型共用）
 */
async function chat(
  messages: ChatMessage[],
  model: string,
  options: { max_tokens?: number; temperature?: number; timeoutMs?: number } = {}
): Promise<string> {
  const apiKey = getSetting('dashscope_api_key', process.env.DASHSCOPE_API_KEY || '');

  const res = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: options.max_tokens ?? 1500,
      temperature: options.temperature ?? 0.3,
    }),
    signal: AbortSignal.timeout(options.timeoutMs ?? 25_000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DashScope API error ${res.status}: ${err.slice(0, 300)}`);
  }

  const data: OpenAIResponse = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? '';
}

// ─── 文本模型功能 ───────────────────────────────────────────────────

/**
 * AI 智能分类文档（qwen3.5-plus）
 */
export async function aiClassifyDocument(
  content: string,
  title: string = ''
): Promise<{
  categories: Array<{ id: string; name: string; confidence: number }>;
  keywords: string[];
  summary: string;
}> {
  const truncated = content.slice(0, 3000);

  const systemPrompt = `你是一个拥有10年经验的资深企业级IT架构师和AI产品专家。请仔细阅读用户提供的文档片段（包含文件名、前几个段落和提取的关键信息），并将其精准归类到以下10个类别之一。

【核心规则】
你必须且只能输出类别的英文ID（不要有任何标点符号、换行或多余的解释）。

【分类标准与特征画像】
1. 'product' (产品/业务线):
   - 包含: 产品介绍、产品方案、商业计划书、行业白皮书、竞品分析、解决方案。
   - 核心词: 痛点、业务场景、核心诉求、产品矩阵、商业化、用户体验、全场景。
   - 结构特征: 通常包含"市场背景"、"用户画像"、"功能清单(Feature List)"。

2. 'tech' (技术/工程研发):
   - 包含: API接口文档、测试报告、系统架构图、部署指南、运维手册。
   - 核心词: 测试用例、拓扑图、服务器配置、微服务、高可用、并发、报错、大模型算力。
   - 结构特征: 含有大量英文术语、代码片段、IP地址、环境依赖说明。

3. 'report' (报表/数据核算):
   - 包含: 项目报价表、成本核算、BOM单、硬件配置清单、数据统计报表。
   - 核心词: 单价、总计、预算、折扣、数量、规格型号。
   - 结构特征: 内容呈现高度的"表格化"、"行列对齐"，包含密集的数字和金额。

4. 'bidding' (招投标/商务审查):
   - 包含: 招标文件、投标文件、评分偏离表、资质证明、采购。
   - 核心词: 招标人、投标人、评标办法、实质性响应、废标、资质要求、授权书。
   - 结构特征: 语言极度严谨，常带有"第一章 招标公告"、"附件格式"等明显公文格式。

5. 'policy' (政策/合规管理):
   - 包含: 国家标准、行业规范、公司规章制度、红头文件。
   - 核心词: 规定、办法、通知、合规、处罚、严禁、国家标准(GB)。
   - 结构特征: 带有发文字号（如"X政发〔2026〕X号"），条款通常以"第一条"、"第二条"排列。

6. 'meeting' (会议/沟通协作):
   - 包含: 会议记录、客户拜访纪要、需求评审结论、交流。
   - 核心词: 与会者、会议时间、待办事项(Todo)、决议、下一步计划、同步。
   - 结构特征: 通常包含明确的时间、地点、参会人列表以及按条列出的Action Item。

7. 'training' (赋能/培训操作):
   - 包含: 赋能培训PPT、新员工入职指南、系统操作手册。
   - 核心词: 目的、流程介绍、第一步、注意事项、操作演示。
   - 结构特征: 步骤化明显（Step 1, Step 2），语气偏向教学和指导。

8. 'image' (纯视觉资产):
   - 纯图片文件（通常由系统前置判断，如遇到此项直接输出 image）。

9. 'reimbursement' (财务/差旅报销):
   - 包含: 电子发票、行程单、打车票据、水单。
   - 核心词: 发票代码、价税合计、开票日期、纳税人识别号、购买方。
   - 结构特征: 文本极其简短，围绕税务和票据流水号展开。

10. 'other' (其他/碎片记录):
    - 明显不属于以上任何一类，或信息量过少无法判断的文档。

【防混淆排他指南（优先级最高）】
- 如果文档同时包含"业务痛点"和"技术架构"，但侧重于向客户兜售价值，归为 'product'；如果侧重于指导工程师如何安装部署，归为 'tech'。
- 如果是带有具体金额和硬件清单的 Word/Excel，不要归入 'product'，必须归为 'report'。
- 只要出现"评标"、"资质响应"等词汇，无视其他内容，强制归入 'bidding'。

请分析以下文档信息，仅返回对应的英文ID：`;

  try {
    const result = await chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `标题：${title || '未知'}\n\n内容：\n${truncated}` },
      ],
      'qwen3.5-plus',
      { timeoutMs: 40_000 }
    );

    const categoryId = result.replace(/['"\`]/g, '').trim().toLowerCase();

    // Attempt to map back to a defined category to get its name
    const { getCategoryById } = await import('@/lib/classifier/categories');
    const categoryDef = getCategoryById(categoryId);
    const categoryName = categoryDef ? categoryDef.name : '其他记录';
    const finalId = categoryDef ? categoryDef.id : 'other';

    return {
      categories: [{ id: finalId, name: categoryName, confidence: 1 }],
      keywords: [],
      summary: '',
    };
  } catch (error) {
    console.error('AI classification error:', error);
    return {
      categories: [{ id: 'other', name: '其他记录', confidence: 1 }],
      keywords: [],
      summary: content.slice(0, 200),
    };
  }
}

/**
 * AI 生成文档摘要（qwen3.5-flash）
 */
export async function aiGenerateSummary(content: string, maxLength = 200): Promise<string> {
  try {
    return await chat(
      [
        { role: 'system', content: '你是一个专业的文档摘要助手。请为用户提供的文档生成一个简洁、准确的摘要。摘要应该包含文档的核心内容和主要观点。' },
        { role: 'user', content: `请为以下文档生成一个${maxLength}字以内的摘要：\n\n${content.slice(0, 4000)}` },
      ],
      'qwen3.5-flash'
    );
  } catch (error) {
    console.error('AI summary error:', error);
    return content.slice(0, maxLength);
  }
}

/**
 * AI 提取关键词（qwen3.5-flash）
 */
export async function aiExtractKeywords(content: string, count = 10): Promise<string[]> {
  try {
    const result = await chat(
      [
        { role: 'system', content: '你是一个关键词提取助手。请从用户提供的文档中提取最重要的关键词。只返回关键词列表，用逗号分隔。' },
        { role: 'user', content: `请从以下文档中提取${count}个最重要的关键词：\n\n${content.slice(0, 3000)}` },
      ],
      'qwen3.5-flash'
    );
    return result.split(/[,，、\n]/).map((k) => k.trim()).filter(Boolean).slice(0, count);
  } catch (error) {
    console.error('AI keywords error:', error);
    return [];
  }
}

/**
 * AI 智能问答（qwen3.5-plus）
 */
export async function aiDocumentQA(content: string, question: string): Promise<string> {
  try {
    return await chat(
      [
        { role: 'system', content: '你是一个文档问答助手。请根据用户提供的文档内容回答问题。如果文档中没有相关信息，请明确说明。' },
        { role: 'user', content: `文档内容：\n${content.slice(0, 4000)}\n\n问题：${question}` },
      ],
      'qwen3.5-plus',
      { timeoutMs: 40_000 }
    );
  } catch (error) {
    console.error('AI QA error:', error);
    return '抱歉，无法回答该问题。';
  }
}

// ─── 视觉模型功能 ───────────────────────────────────────────────────

/**
 * 图片内容识别（qwen3-vl-plus）
 * base64Data: 纯 base64 字符串，mimeType: 如 image/png
 */
export async function analyzeImage(base64Data: string, mimeType: string): Promise<string> {
  try {
    return await chat(
      [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } },
            { type: 'text', text: '请详细描述这张图片的内容，提取图中所有可见的文字（如有），并总结图片的主要信息。用中文回答。' },
          ],
        },
      ],
      'qwen3-vl-plus',
      { max_tokens: 1000, timeoutMs: 55_000 }
    );
  } catch (error) {
    console.error('DashScope Image analysis full error:', error);
    return '【系统提示：图片解析超时或触发接口限流，已跳过】';
  }
}
