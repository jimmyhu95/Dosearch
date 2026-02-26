# Dosearch V4.0.0

Dosearch 是一个高性能的本地文档智能管理与搜索系统。V4.0.0 版本引入了深度报表解析与 AI 增强问答能力。

## V4.0.0 核心特性

- **智能解析**：支持 `.xlsx`/`.xls` 本地 CSV 结构化转换，精准获取表格深层数据。
- **深度推理**：集成 **Qwen-3.5-Plus** 推理链，支持针对复杂报表的智能问答与数据洞察。
- **视觉进化**：采用 **Bento Grid** 布局风格重构 UI，提供更柔和、极简的科技感体验。
- **安全隔离**：全本地化索引，关键 AI 逻辑与 API 密钥物理隔离。

## 技术栈

- **Frontend**: Next.js 15 (App Router), Tailwind CSS
- **Database**: SQLite (Drizzle ORM)
- **Search**: MeiliSearch (Full-text), Vector Search
- **AI**: 阿里云百炼 (Qwen 系列)

## ✨ 核心功能 (Features)

- 🔍 **多格式全覆盖**：兼容 PDF、Word、Excel、PPT、xlsx等多类主流文档格式的内容深度解析。
- 👁️ **图像知识提取**：调用视觉大语言模型（如 Qwen3.5-VL），支持自动剥离并解读 JPEG / PNG 等图片素材中的文本流。
- ⚡ **毫秒级高亮检索**：全文搜索结果将在文档标题、摘要及正文中精准实施关键词高亮。
-  **本地文件交互**：所有检索结果直接关联操作系统，支持一键**打开本地文件源目录**或**直接提取副本**，实现高频资料快查提取。
- ⚙️ **免服务重启热配**：API Key 及数据库节点随时动态调整。

## 🛠️ 技术底座 (Tech Stack)

- **前端架构与交互**：Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4 + Zustand
- **核心数据中间件**：SQLite (better-sqlite3) + Drizzle ORM
- **分词与检索引擎**：MeiliSearch
- **AI 智能中枢驱动**：阿里云百炼 (DashScope) 语言归类及视觉多模态大模型
- **解析管道矩阵**：pdf-parse, mammoth, xlsx, jszip

## � 核心目录架构 (Architecture)

```text
do-search-system/
├── src/
│   ├── app/                    # Next.js Server Components
│   │   ├── api/                # 文件系统服务底层
│   │   ├── admin/              # 目录控制器入口
│   │   └── search/             # 维度筛选展示层 
│   ├── lib/
│   │   ├── classifier/         # API与大语言分类
│   │   ├── parsers/            # 文档解析
│   │   ├── search/             # MeiliSearch节点配置
│   │   └── db/                 # 数据库
│   └── components/             # Next.js解析区块
├── public/                     # 静态资产
└── package.json                
```

## 📦 极简部署指南 (Deployment)

### 1. 基础环境
- 确保系统已部署 **Node.js 18+**。
- 获取 **阿里云百炼 API Key** 。

### 2. 节点及依赖初始化
安装前后端所有必须依赖包，并克隆环境变量模板：
```bash
npm install
cp .env.example .env.local
```

### 3. 拉起检索引擎后端
系统依赖MeiliSearch进行毫秒级的高亮词切片匹配服务：

**对于Windows（推荐）：**
```powershell
# Windows
Invoke-WebRequest -Uri "https://github.com/meilisearch/meilisearch/releases/download/v1.6.0/meilisearch-windows-amd64.exe" -OutFile ".\meilisearch.exe"
.\meilisearch.exe --env development --no-analytics
```

**对于容器化操作（Docker）：**
```bash
docker-compose up -d
```

### 4. 运行
在项目根目录启动：
```bash
npm run dev
```

成功拉起后，通过浏览器访问 `http://localhost:3800`，即可进行本地目录抓取及交互式全量检索。
