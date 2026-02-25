import Link from 'next/link';
import { Search, FileText, FolderOpen, Zap, Shield, Cpu } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SearchBar } from '@/components/search/SearchBar';

// 强制动态渲染
export const dynamic = 'force-dynamic';

export default function HomePage() {
  const features = [
    {
      icon: Search,
      title: '智能搜索',
      description: '支持全文搜索和语义搜索，快速找到您需要的文档',
    },
    {
      icon: Cpu,
      title: 'AI 分类',
      description: '基于阿里云百炼 AI 自动分析文档内容并智能分类',
    },
    {
      icon: FileText,
      title: '多格式支持',
      description: '支持 PDF、Word、Excel、PPT、TXT 等多种文档格式',
    },
    {
      icon: FolderOpen,
      title: '本地存储',
      description: '所有数据存储在本地，保护您的隐私安全',
    },
    {
      icon: Zap,
      title: '高性能',
      description: '基于 MeiliSearch 的毫秒级搜索响应',
    },
    {
      icon: Shield,
      title: '安全可靠',
      description: '完全本地运行，无需担心数据泄露',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="container mx-auto px-4 py-20 relative">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                本地文档分析与搜索系统
              </h1>
              <p className="text-xl text-blue-100 mb-10">
                智能扫描、分析、分类您的本地文档，提供强大的全文搜索和语义搜索功能
              </p>
              
              {/* 搜索框 */}
              <div className="max-w-2xl mx-auto">
                <SearchBar 
                  size="lg" 
                  placeholder="输入关键词搜索文档..." 
                />
              </div>
            </div>
          </div>
        </section>

        {/* 功能特性 */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
              核心功能
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div 
                    key={index}
                    className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 快速开始 */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                快速开始
              </h2>
              <p className="text-gray-600 mb-8">
                只需几步即可开始使用文档搜索系统
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mb-4">
                    1
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">配置扫描路径</h3>
                  <p className="text-sm text-gray-600">
                    在管理面板中设置要扫描的文件夹路径
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mb-4">
                    2
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">启动扫描</h3>
                  <p className="text-sm text-gray-600">
                    系统会自动扫描、解析并索引您的文档
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mb-4">
                    3
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">开始搜索</h3>
                  <p className="text-sm text-gray-600">
                    使用搜索框快速找到您需要的文档
                  </p>
                </div>
              </div>
              <Link
                href="/admin"
                className="inline-flex items-center justify-center mt-8 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                进入管理面板
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
