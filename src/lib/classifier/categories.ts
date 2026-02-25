// 分类定义和配置

export interface CategoryDefinition {
  id: string;
  name: string;
  slug: string;
  keywords: string[];
  patterns: RegExp[];
  description: string;
  icon: string;
  color: string;
}

// 预定义的分类及其关键词
export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  {
    id: 'product',
    name: '产品文档',
    slug: 'product',
    keywords: ['prd', 'mrd', '商业计划', '解决方案', '白皮书', '竞品分析', '痛点', '业务场景', '产品架构', '需求'],
    patterns: [/\b(prd|mrd)\b/i, /痛点|业务场景|产品架构|解决方案/],
    description: '产品需求(PRD/MRD)、行业解决方案、白皮书、竞品分析等。',
    icon: 'package',
    color: '#3B82F6', // Blue
  },
  {
    id: 'tech',
    name: '技术文档',
    slug: 'tech',
    keywords: ['api', '代码', '测试报告', '系统架构', '部署指南', '服务器配置', '测试用例', '环境', '接口', '架构'],
    patterns: [/\b(api|sdk|http|https|rest|graphql)\b/i, /测试报告|系统架构图|算力|私有化部署|测试用例/],
    description: 'API接口文档、测试报告、系统架构图、算力/私有化部署指南等。',
    icon: 'terminal',
    color: '#8B5CF6', // Purple
  },
  {
    id: 'report',
    name: '报表',
    slug: 'report',
    keywords: ['bom', '报价', '成本核算', '数据统计', '明细', '报表', '金额'],
    patterns: [/\b(bom)\b/i, /项目报价表|成本核算表|数据统计表/],
    description: 'BOM表、项目报价表、成本核算表、数据统计表等。',
    icon: 'table',
    color: '#10B981', // Green
  },
  {
    id: 'bidding',
    name: '标书',
    slug: 'bidding',
    keywords: ['招标', '投标', '商务技术响应', '评分标准', '询价单', '评标', '资质', '甲方', '标书'],
    patterns: [/招标文件|投标书|商务技术响应表|评分标准/],
    description: '招标文件、投标书、商务技术响应表、评分标准等。',
    icon: 'briefcase',
    color: '#F59E0B', // Yellow
  },
  {
    id: 'policy',
    name: '政策文件',
    slug: 'policy',
    keywords: ['国家标准', '行业规范', '管理制度', '规定', '办法', '通知', '红头文件', '规章制度'],
    patterns: [/国家标准|行业规范|内部管理制度/],
    description: '国家标准、行业规范、公司内部管理制度等。',
    icon: 'landmark',
    color: '#EF4444', // Red
  },
  {
    id: 'meeting',
    name: '会议纪要',
    slug: 'meeting',
    keywords: ['交流', '访谈', '调研', '座谈', '汇报', '纪要', '会议', 'Minutes', 'Meeting', '拜访记录', '周会', '复盘', '需求评审', '与会者', '讨论决议', '待办事项', 'todo'],
    patterns: [/\b(todo|action item)\b/i, /客户拜访记录|周会纪要|项目复盘|需求评审记录/],
    description: '客户拜访记录、周会纪要、项目复盘、需求评审记录等。',
    icon: 'users',
    color: '#06B6D4', // Cyan
  },
  {
    id: 'training',
    name: '培训材料',
    slug: 'training',
    keywords: ['赋能', '新员工', '入职', '操作手册', '目的', '流程介绍', '注意事项', '教程', '指引', '培训'],
    patterns: [/产品赋能培训|新员工入职|操作手册/],
    description: '产品赋能培训、新员工入职PPT、操作手册等。',
    icon: 'presentation',
    color: '#84CC16', // Lime
  },
  {
    id: 'image',
    name: '图片',
    slug: 'image',
    keywords: ['image', 'photo', 'picture', 'screenshot', 'diagram', '图片', '照片', '截图', '图表', '图像'],
    patterns: [],
    description: 'PNG/JPG等纯图片资产。',
    icon: 'image',
    color: '#F97316', // Orange
  },
  {
    id: 'reimbursement',
    name: '报销文件',
    slug: 'reimbursement',
    keywords: ['电子发票', 'ofd', '行程单', '打车票', '发票代码', '价税合计', '开票日期', '水单', '报销'],
    patterns: [/\b(ofd)\b/i, /电子发票|行程单|打车票据|发票代码|价税合计/],
    description: '电子发票(PDF/OFD)、行程单、打车票据等。',
    icon: 'receipt',
    color: '#EC4899', // Pink
  },
  {
    id: 'other',
    name: '其他记录',
    slug: 'other',
    keywords: [],
    patterns: [],
    description: '无法归入以上任何一类的碎片化文档。',
    icon: 'folder',
    color: '#6B7280', // Gray
  },
];

/**
 * 根据 slug 获取分类定义
 */
export function getCategoryBySlug(slug: string): CategoryDefinition | undefined {
  return CATEGORY_DEFINITIONS.find(c => c.slug === slug);
}

/**
 * 根据 ID 获取分类定义
 */
export function getCategoryById(id: string): CategoryDefinition | undefined {
  return CATEGORY_DEFINITIONS.find(c => c.id === id);
}

/**
 * 获取所有分类（不包括"其他"）
 */
export function getMainCategories(): CategoryDefinition[] {
  return CATEGORY_DEFINITIONS.filter(c => c.id !== 'other');
}
