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
                        {fieldDefs.map(({ key, label, icon: Icon, placeholder, hint, sensitive, testable }) => {
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
                                            type={sensitive && !field.show ? 'password' : 'text'}
                                            placeholder={placeholder}
                                            value={field.value}
                                            onChange={(e) => setField(key, { value: e.target.value, dirty: true })}
                                        />
                                        {sensitive && (
                                            <button
                                                type="button"
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                onClick={() => setField(key, { show: !field.show })}
                                            >
                                                {field.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                        })}

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
