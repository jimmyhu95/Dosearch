'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FolderSync, FileText, HardDrive, Clock,
  Play, Settings, BarChart3, RefreshCw,
  CheckCircle, XCircle, Loader2, Trash2, AlertTriangle
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatFileSize, formatRelativeTime } from '@/lib/utils';
import type { SystemStats, ScanHistory } from '@/types';

export default function AdminPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([]);
  const [scanPath, setScanPath] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);
  const [clearing, setClearing] = useState<'history' | 'all' | null>(null);
  const [clearResult, setClearResult] = useState<{ success: boolean; message: string } | null>(null);

  // 获取统计数据
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  // 获取扫描历史
  const fetchScanHistory = async () => {
    try {
      const res = await fetch('/api/scan');
      const data = await res.json();
      if (data.success) {
        setScanHistory(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch scan history:', error);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchScanHistory();
  }, []);

  // 清除数据
  const handleClear = async (target: 'history' | 'all') => {
    const label = target === 'history' ? '扫描历史' : '所有文档记录';
    if (!window.confirm(`确认清除${label}？此操作不可撤销。`)) return;
    setClearing(target);
    setClearResult(null);
    try {
      const res = await fetch(`/api/admin/clear?target=${target}`, { method: 'DELETE' });
      const data = await res.json();
      setClearResult({ success: data.success, message: data.message || data.error || '操作失败' });
      if (data.success) {
        fetchStats();
        fetchScanHistory();
      }
    } catch {
      setClearResult({ success: false, message: '请求失败' });
    } finally {
      setClearing(null);
    }
  };

  // 执行扫描
  const handleScan = async () => {
    if (!scanPath.trim()) {
      setScanResult({ success: false, message: '请输入扫描路径' });
      return;
    }

    setIsScanning(true);
    setScanResult(null);

    try {
      const res = await fetch(`/api/scan?t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: scanPath, options: { recursive: true } }),
      });

      const data = await res.json();

      if (data.success) {
        setScanResult({
          success: true,
          message: `扫描完成！处理了 ${data.data.processedFiles} 个文件，新增 ${data.data.newFiles} 个，更新 ${data.data.updatedFiles} 个`,
        });
        fetchStats();
        fetchScanHistory();
      } else {
        setScanResult({ success: false, message: data.error || '扫描失败' });
      }
    } catch (error) {
      setScanResult({ success: false, message: '扫描请求失败' });
    } finally {
      setIsScanning(false);
    }
  };

  const statCards = [
    {
      title: '文档总数',
      value: stats?.totalDocuments || 0,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: '分类数量',
      value: stats?.totalCategories || 0,
      icon: FolderSync,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: '关键词数',
      value: stats?.totalKeywords || 0,
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: '存储空间',
      value: formatFileSize(stats?.storageUsed || 0),
      icon: HardDrive,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      isString: true,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">管理面板</h1>
          <p className="text-gray-600">
            管理文档扫描、查看统计数据和系统设置
          </p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${card.color}`} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{card.title}</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {card.isString ? card.value : card.value.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 扫描配置 */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FolderSync className="w-5 h-5" />
                文档扫描
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  扫描路径
                </label>
                <Input
                  placeholder="输入要扫描的文件夹路径，如 /home/user/documents"
                  value={scanPath}
                  onChange={(e) => setScanPath(e.target.value)}
                />
                <p className="mt-1 text-xs text-gray-500">
                  支持的格式：PDF、Word、Excel、PPT、TXT、PNG/JPG 图片（图片识别需配置阿里云百炼 API Key）
                </p>
              </div>

              {scanResult && (
                <div className={`p-4 rounded-lg ${scanResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  <div className="flex items-center gap-2">
                    {scanResult.success ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <XCircle className="w-5 h-5" />
                    )}
                    {scanResult.message}
                  </div>
                </div>
              )}

              <Button
                onClick={handleScan}
                loading={isScanning}
                className="w-full"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    扫描中...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    开始扫描
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 扫描历史 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  扫描历史
                </h2>
                <Button variant="ghost" size="sm" onClick={fetchScanHistory}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {scanHistory.length > 0 ? (
                <div className="space-y-3">
                  {scanHistory.slice(0, 5).map((scan) => (
                    <div
                      key={scan.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {scan.scanPath}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatRelativeTime(scan.startedAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {scan.processedFiles} 文件
                        </span>
                        <Badge
                          variant={scan.status === 'completed' ? 'success' : scan.status === 'failed' ? 'danger' : 'warning'}
                        >
                          {scan.status === 'completed' ? '完成' : scan.status === 'failed' ? '失败' : '进行中'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无扫描记录</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 危险操作 */}
        <Card className="mt-8 border-red-200">
          <CardHeader>
            <h2 className="text-lg font-semibold text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              危险操作
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {clearResult && (
              <div className={`p-4 rounded-lg flex items-center gap-2 ${clearResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                {clearResult.success
                  ? <CheckCircle className="w-5 h-5 shrink-0" />
                  : <XCircle className="w-5 h-5 shrink-0" />}
                {clearResult.message}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => handleClear('history')}
                loading={clearing === 'history'}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {clearing === 'history' ? '清除中...' : '清除扫描历史'}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleClear('all')}
                loading={clearing === 'all'}
                className="border-red-500 text-red-700 hover:bg-red-50 font-semibold"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {clearing === 'all' ? '清除中...' : '清除所有文档记录'}
              </Button>
            </div>
            <p className="text-xs text-gray-500">「清除扫描历史」仅删除历史记录；「清除所有文档记录」将同时删除文档、关键词、分类及搜索索引，操作不可撤销。</p>
          </CardContent>
        </Card>

        {stats?.documentsByType && Object.keys(stats.documentsByType).length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                文件类型分布
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {Object.entries(stats.documentsByType).map(([type, count]) => (
                  <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                    <p className="text-sm text-gray-500 uppercase">{type}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
