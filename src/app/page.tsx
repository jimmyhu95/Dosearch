import Link from 'next/link';
import { Search, FileText, FolderOpen, Zap, Shield, Cpu, ArrowRight } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SearchBar } from '@/components/search/SearchBar';
import { cn } from '@/lib/utils';

// 强制动态渲染
export const dynamic = 'force-dynamic';

export default function HomePage() {
  const features = [
    {
      icon: Search,
      title: '智能搜索',
      description: '支持全文搜索和语义搜索，快速找到您需要的文档',
      image: '/assets/features/smart_search.png',
    },
    {
      icon: Cpu,
      title: 'AI 分类',
      description: '基于AI自动分析文档内容并智能分类',
      image: '/assets/features/ai_classify.png',
    },
    {
      icon: FileText,
      title: '支持多格式',
      description: 'PDF、Word、Excel、PPT、PNG、OFD等多种文档格式',
      image: '/assets/features/format_support.png',
    },
    {
      icon: FolderOpen,
      title: '本地存储',
      description: '所有数据存储在本地，保护您的隐私安全',
      image: '/assets/features/local_storage.png',
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f7f4] font-sans selection:bg-black/10">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-transparent text-zinc-900 pt-32 pb-24">
          {/* Subtle Pastel Gradient Blurs */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-indigo-200/40 to-purple-200/40 rounded-full blur-[100px] opacity-70 mix-blend-multiply pointer-events-none" />
          <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-rose-200/40 to-orange-200/40 rounded-full blur-[100px] opacity-70 mix-blend-multiply pointer-events-none" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center mt-8">
              <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-zinc-900 leading-[1.1]">
                全面掌控
                <br />
                您的本地文件
              </h1>
              <p className="text-xl text-zinc-500 mb-12 max-w-2xl mx-auto font-light leading-relaxed whitespace-nowrap">
                支持文件智能扫描、分析和语义搜索，在极简界面中管理所有的本地文件
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

        {/* features Bento Grid */}
        <section className="py-24 bg-transparent relative z-10">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-3xl font-bold text-zinc-900 mb-4 tracking-tight">
                  核心功能
                </h2>
                <p className="text-zinc-500">管理本地文档所需的一切功能</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-min">
              {features.map((feature, index) => {
                const Icon = feature.icon;

                return (
                  <div
                    key={index}
                    className={cn(
                      'rounded-[32px] p-0 transition-all duration-300 flex flex-col relative overflow-hidden group min-h-[400px]',
                      'bg-white/70 backdrop-blur-md border border-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] text-zinc-900',
                    )}
                  >
                    <div className="flex-1 w-full relative z-10 overflow-hidden pt-8 px-8 flex justify-center items-center">
                      <img
                        src={feature.image}
                        alt={feature.title}
                        className="w-full object-contain max-h-[160px] drop-shadow-sm group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                    </div>

                    <div className="mt-auto p-8 relative z-10 bg-gradient-to-t from-white/60 to-transparent">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-zinc-100/80 backdrop-blur-sm">
                          <Icon className="w-5 h-5 text-zinc-700" />
                        </div>
                        <h3 className="text-xl font-semibold tracking-tight">
                          {feature.title}
                        </h3>
                      </div>
                      <p className="text-sm text-zinc-500">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 快速开始 */}
        <section className="py-24 bg-white rounded-t-[3rem] shadow-[0_-10px_40px_rgba(0,0,0,0.02)] relative z-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-zinc-900 mb-6 tracking-tight">
                快速开始
              </h2>
              <p className="text-zinc-500 mb-16 text-lg">
                只需几步即可开始使用文档搜索系统
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <div className="bg-[#f8f7f4] rounded-[32px] p-8 border border-black/5 hover:bg-zinc-100 transition-colors">
                  <div className="w-10 h-10 bg-zinc-900 text-white rounded-full flex items-center justify-center font-bold mb-6 shadow-md">
                    1
                  </div>
                  <h3 className="font-semibold text-zinc-900 text-lg mb-3">配置扫描路径</h3>
                  <p className="text-zinc-500">
                    在管理面板中设置要扫描的文件夹路径
                  </p>
                </div>
                <div className="bg-[#f8f7f4] rounded-[32px] p-8 border border-black/5 hover:bg-zinc-100 transition-colors">
                  <div className="w-10 h-10 bg-zinc-900 text-white rounded-full flex items-center justify-center font-bold mb-6 shadow-md">
                    2
                  </div>
                  <h3 className="font-semibold text-zinc-900 text-lg mb-3">启动扫描</h3>
                  <p className="text-zinc-500">
                    系统会自动扫描、解析并索引您的文档
                  </p>
                </div>
                <div className="bg-[#f8f7f4] rounded-[32px] p-8 border border-black/5 hover:bg-zinc-100 transition-colors">
                  <div className="w-10 h-10 bg-zinc-900 text-white rounded-full flex items-center justify-center font-bold mb-6 shadow-md">
                    3
                  </div>
                  <h3 className="font-semibold text-zinc-900 text-lg mb-3">开始搜索</h3>
                  <p className="text-zinc-500">
                    使用搜索框快速找到您需要的文档
                  </p>
                </div>
              </div>
              <Link
                href="/admin"
                className="inline-flex items-center justify-center mt-12 px-8 py-4 bg-zinc-900 text-white font-medium rounded-full hover:bg-zinc-800 transition-all shadow-[0_8px_20px_rgb(0,0,0,0.12)] hover:shadow-[0_12px_24px_rgb(0,0,0,0.16)] text-lg"
              >
                进入管理面板 <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div >
  );
}
