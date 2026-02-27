'use client';

import { useState, useEffect } from 'react';
import {
    Key, Server, CheckCircle, XCircle,
    Save, Eye, EyeOff, Wifi, Loader2,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

interface SettingInfo {
    masked: string;
    configured: boolean;
}

interface Settings {
    api_mode: SettingInfo;
    private_base_url: SettingInfo;
    private_api_key: SettingInfo;
    private_model_name: SettingInfo;
    dashscope_api_key: SettingInfo;
    meilisearch_host: SettingInfo;
    meilisearch_api_key: SettingInfo;
}

interface FieldState {
    value: string;
    show: boolean;
    dirty: boolean;
}

interface TestResult {
    ok: boolean;
    msg: string;
}

const DEFAULTS = { meilisearch_host: 'http://localhost:7700' };

export default function SettingsPage() {
    const [settings, setSettings] = useState<Settings | null>(null);
    const [fields, setFields] = useState<Record<string, FieldState>>({
        api_mode: { value: 'public', show: true, dirty: false },
        private_base_url: { value: '', show: true, dirty: false },
        private_api_key: { value: '', show: false, dirty: false },
        private_model_name: { value: '', show: true, dirty: false },
        dashscope_api_key: { value: '', show: false, dirty: false },
        meilisearch_host: { value: '', show: true, dirty: false },
        meilisearch_api_key: { value: '', show: false, dirty: false },
    });
    const [saving, setSaving] = useState(false);
    const [testingKey, setTestingKey] = useState<string | null>(null);
    const [saveResult, setSaveResult] = useState<TestResult | null>(null);
    const [testResults, setTestResults] = useState<Record<string, TestResult>>({});

    useEffect(() => {
        fetch('/api/settings')
            .then((r) => r.json())
            .then((data) => { if (data.success) setSettings(data.data); });
    }, []);

    function setField(key: string, partial: Partial<FieldState>) {
        if (key === 'api_mode') {
            setFields((prev) => ({ ...prev, [key]: { ...prev[key], ...partial, dirty: true } }));
            return;
        }
        setFields((prev) => ({ ...prev, [key]: { ...prev[key], ...partial } }));
    }

    async function handleSave() {
        setSaving(true);
        setSaveResult(null);
        try {
            const body: Record<string, string> = {};
            for (const [key, state] of Object.entries(fields)) {
                if (state.dirty && state.value.trim() !== '') body[key] = state.value.trim();
            }
            if (Object.keys(body).length === 0) {
                setSaveResult({ ok: false, msg: '没有修改任何配置项' });
                return;
            }
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.success) {
                setSaveResult({ ok: true, msg: `已成功保存 ${data.updated.length} 项配置` });
                const fresh = await fetch('/api/settings').then((r) => r.json());
                if (fresh.success) setSettings(fresh.data);
                setFields((prev) => {
                    const next = { ...prev };
                    for (const key of data.updated) next[key] = { ...next[key], value: '', dirty: false };
                    return next;
                });
            } else {
                setSaveResult({ ok: false, msg: data.error || '保存失败' });
            }
        } finally {
            setSaving(false);
        }
    }

    async function handleTest(fieldKey: string) {
        setTestingKey(fieldKey);
        setTestResults((prev) => { const n = { ...prev }; delete n[fieldKey]; return n; });
        try {
            let body: Record<string, string> = {};
            if (fieldKey === 'dashscope_api_key') {
                const v = fields.dashscope_api_key.value.trim();
                body = { type: 'dashscope', ...(v ? { apiKey: v } : {}) };
            } else if (fieldKey === 'meilisearch_host') {
                const v = fields.meilisearch_host.value.trim();
                body = { type: 'meilisearch', ...(v ? { host: v } : {}) };
            } else if (fieldKey === 'private_base_url') {
                const baseUrl = fields.private_base_url.value.trim();
                const apiKey = fields.private_api_key.value.trim();
                const modelName = fields.private_model_name.value.trim();
                body = { type: 'private', ...(baseUrl ? { baseUrl } : {}), ...(apiKey ? { apiKey } : {}), ...(modelName ? { modelName } : {}) };
            }
            const res = await fetch('/api/settings/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            setTestResults((prev) => ({
                ...prev,
                [fieldKey]: { ok: data.success, msg: data.message || data.error || '未知错误' },
            }));
        } catch (e) {
            setTestResults((prev) => ({
                ...prev,
                [fieldKey]: { ok: false, msg: '请求失败：' + String(e) },
            }));
        } finally {
            setTestingKey(null);
        }
    }

    const fieldDefs = [
        {
            key: 'api_mode',
            label: 'AI 模型服务模式',
            icon: Server,
            placeholder: '',
            hint: '',
            sensitive: false,
            testable: false,
        },
        {
            key: 'private_base_url',
            label: '本地 Base URL',
            icon: Server,
            placeholder: 'http://127.0.0.1:8000/v1',
            hint: '请确保包含 /v1 后缀（如果使用的是 vLLM 或 OpenAI 兼容接口）',
            sensitive: false,
            testable: true,
        },
        {
            key: 'private_api_key',
            label: '本地 API Key',
            icon: Key,
            placeholder: '输入私有 API Key（若无则留空）',
            hint: '本地部署时如果不需要鉴权可以不填',
            sensitive: true,
            testable: false,
        },
        {
            key: 'private_model_name',
            label: '模型名称 (Model Name)',
            icon: Server,
            placeholder: '例如：Qwen-14B-Chat',
            hint: '发送至本地后端的强制模型名称',
            sensitive: false,
            testable: false,
        },
        {
            key: 'dashscope_api_key',
            label: '阿里云百炼 API Key',
            icon: Key,
            placeholder: '输入新的 Key（留空则不修改）',
            hint: '用于 AI 智能分类和摘要生成（当前采用 Qwen3.5 系列模型）',
            sensitive: true,
            testable: true,
        },
        {
            key: 'meilisearch_host',
            label: 'MeiliSearch 服务地址',
            icon: Server,
            placeholder: DEFAULTS.meilisearch_host,
            hint: 'MeiliSearch 实例 HTTP 地址',
            sensitive: false,
            testable: true,
        },
        {
            key: 'meilisearch_api_key',
            label: 'MeiliSearch API Key',
            icon: Key,
            placeholder: '输入 MeiliSearch Master Key（无密码可留空）',
            hint: '仅在 MeiliSearch 启用了认证时需要填写',
            sensitive: true,
            testable: false,
        },
    ];

    const renderField = (key: string) => {
        const def = fieldDefs.find(f => f.key === key);
        if (!def) return null;

        const { label, icon: Icon, placeholder, hint, sensitive, testable } = def;
        const info = settings?.[key as keyof Settings];
        const field = fields[key];
        const tr = testResults[key];

        return (
            <div key={key}>
                <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Icon className="w-4 h-4 text-gray-500" />
                        {label}
                    </label>
                    <div className="flex items-center gap-2">
                        {testable && (
                            <button
                                type="button"
                                onClick={() => handleTest(key)}
                                disabled={testingKey === key}
                                className="flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-blue-300 text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-colors"
                            >
                                {testingKey === key
                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                    : <Wifi className="w-3 h-3" />}
                                {testingKey === key ? '测试中...' : '测试连接'}
                            </button>
                        )}
                        {info && (
                            <Badge variant={info.configured ? 'success' : 'warning'}>
                                {info.configured ? '已配置' : '未配置'}
                            </Badge>
                        )}
                    </div>
                </div>

                {info?.configured && (
                    <p className="text-xs text-gray-500 mb-2 font-mono">
                        当前值：{info.masked}
                    </p>
                )}

                <div className="relative">
                    <Input
                        type={sensitive && !field?.show ? 'password' : 'text'}
                        placeholder={placeholder}
                        value={field?.value ?? ''}
                        onChange={(e) => setField(key, { value: e.target.value, dirty: true })}
                    />
                    {sensitive && (
                        <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            onClick={() => setField(key, { show: !field?.show })}
                        >
                            {field?.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    )}
                </div>

                <p className="mt-1 text-xs text-gray-500">{hint}</p>

                {tr && (
                    <div className={`mt-2 p-3 rounded-lg flex items-center gap-2 text-sm ${tr.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {tr.ok
                            ? <CheckCircle className="w-4 h-4 shrink-0" />
                            : <XCircle className="w-4 h-4 shrink-0" />}
                        {tr.msg}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">系统配置</h1>
                    <p className="text-gray-600">配置 API Key 及服务连接信息，修改后立即生效</p>
                </div>

                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-gray-900">API 配置</h2>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-6">
                            {/* AI 服务模式切换 (Bento Style) */}
                            <div className="col-span-1 md:col-span-2">
                                <div className="flex items-center justify-between mb-4">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <Server className="w-4 h-4 text-gray-500" />
                                        AI 模型服务模式
                                    </label>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div
                                        onClick={() => setField('api_mode', { value: 'public' })}
                                        className={`p-4 border rounded-xl cursor-pointer transition-all ${(fields.api_mode?.value || (settings as any)?.api_mode?.raw || 'public') === 'public'
                                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                            }`}
                                    >
                                        <h3 className="font-semibold text-gray-900 mb-1">公有云服务 (DashScope)</h3>
                                        <p className="text-xs text-gray-500">使用阿里云百炼 Qwen 模型，开箱即用，按量付费。</p>
                                    </div>
                                    <div
                                        onClick={() => setField('api_mode', { value: 'private' })}
                                        className={`p-4 border rounded-xl cursor-pointer transition-all ${(fields.api_mode?.value || (settings as any)?.api_mode?.raw) === 'private'
                                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                            }`}
                                    >
                                        <h3 className="font-semibold text-gray-900 mb-1">本地私有化部署 (Local)</h3>
                                        <p className="text-xs text-gray-500">接入基于 vLLM/Ollama 等兼容 OpenAI 格式的本地服务。</p>
                                    </div>
                                </div>
                            </div>

                            {/* DashScope Settings */}
                            {((fields.api_mode?.value || (settings as any)?.api_mode?.raw || 'public') === 'public') && (
                                <div className="p-5 border rounded-xl space-y-4 bg-white shadow-sm">
                                    <h4 className="font-medium text-gray-900 border-b pb-2 mb-4">百炼配置</h4>
                                    {renderField('dashscope_api_key')}
                                </div>
                            )}

                            {/* Private Local Settings */}
                            {((fields.api_mode?.value || (settings as any)?.api_mode?.raw) === 'private') && (
                                <div className="p-5 border rounded-xl space-y-4 bg-white shadow-sm">
                                    <h4 className="font-medium text-gray-900 border-b pb-2 mb-4">本地模型配置</h4>
                                    <div className="grid gap-4">
                                        {renderField('private_base_url')}
                                        {renderField('private_api_key')}
                                        {renderField('private_model_name')}
                                    </div>
                                </div>
                            )}

                            {/* Meilisearch Settings */}
                            <div className="p-5 border rounded-xl space-y-4 bg-white shadow-sm md:col-span-2">
                                <h4 className="font-medium text-gray-900 border-b pb-2 mb-4">向量及搜索服务 (Meilisearch)</h4>
                                <div className="grid gap-4">
                                    {renderField('meilisearch_host')}
                                    {renderField('meilisearch_api_key')}
                                </div>
                            </div>
                        </div>

                        {saveResult && (
                            <div className={`p-4 rounded-lg flex items-center gap-2 ${saveResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {saveResult.ok
                                    ? <CheckCircle className="w-5 h-5 shrink-0" />
                                    : <XCircle className="w-5 h-5 shrink-0" />}
                                {saveResult.msg}
                            </div>
                        )}

                        <Button onClick={handleSave} loading={saving} className="w-full">
                            <Save className="w-4 h-4 mr-2" />
                            保存配置
                        </Button>
                    </CardContent>
                </Card>
            </main>

            <Footer />
        </div>
    );
}
