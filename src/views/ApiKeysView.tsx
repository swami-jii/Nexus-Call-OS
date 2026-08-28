import React, { useState, useEffect } from 'react';
import {
  Key,
  Plus,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
  Shield,
  Activity,
  Check,
  AlertTriangle,
  Clock,
  Zap,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { apiKeyRepository } from '../repository';
import { ApiKeyItem } from '../types';

export const ApiKeysView: React.FC = () => {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Revealed Keys Set
  const [revealedKeyIds, setRevealedKeyIds] = useState<Record<string, boolean>>({});

  // Generate Key Modal State
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [keyEnvironment, setKeyEnvironment] = useState<'production' | 'development' | 'staging'>('production');
  const [keyPermissions, setKeyPermissions] = useState<'full' | 'restricted' | 'read-only'>('full');
  const [keyExpiration, setKeyExpiration] = useState('Never');

  // Newly Generated Key Modal State
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<ApiKeyItem | null>(null);

  const { addToast } = useToast();

  const loadKeys = async () => {
    try {
      setIsLoading(true);
      const data = await apiKeyRepository.getAll();
      setKeys(data);
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error Loading Keys', description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleGenerateKey = async () => {
    if (!keyName.trim()) {
      addToast({ type: 'error', title: 'Validation Error', description: 'API Key name is required.' });
      return;
    }

    const randomSecret = `nx_${keyEnvironment === 'production' ? 'live' : 'test'}_${Math.random().toString(36).substring(2, 14)}${Math.random().toString(36).substring(2, 14)}`;
    const prefix = `${randomSecret.substring(0, 12)}...`;

    const created = await apiKeyRepository.create({
      name: keyName,
      keyPrefix: prefix,
      fullSecret: randomSecret,
      environment: keyEnvironment,
      permissions: keyPermissions,
      createdDate: new Date().toISOString().split('T')[0],
      lastUsed: 'Never',
      expiration: keyExpiration,
      status: 'active',
      usageCalls: 0,
    });

    setKeys((prev) => [created, ...prev]);
    setIsGenerateModalOpen(false);
    setNewlyCreatedKey(created);
    setKeyName('');
    addToast({
      type: 'success',
      title: 'API Key Generated',
      description: 'Make sure to copy your secret key now. It will not be shown again.',
    });
  };

  const handleToggleReveal = (id: string) => {
    setRevealedKeyIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopySecret = (secret?: string) => {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    addToast({ type: 'success', title: 'Copied', description: 'API Secret token copied to clipboard.' });
  };

  const handleRotateKey = async (item: ApiKeyItem) => {
    try {
      const rotated = await (apiKeyRepository as any).rotate(item.id);
      setKeys((prev) => prev.map((k) => (k.id === item.id ? rotated : k)));
      if (rotated.fullSecret) {
        setNewlyCreatedKey(rotated);
      }
      addToast({
        type: 'info',
        title: 'API Key Rotated',
        description: `Rotated secret token for "${item.name}". Old key invalidated.`,
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Rotation Failed', description: err.message });
    }
  };

  const handleToggleStatus = async (item: ApiKeyItem) => {
    const nextStatus = item.status === 'active' ? 'disabled' : 'active';
    const updated = await apiKeyRepository.update(item.id, { status: nextStatus });
    setKeys((prev) => prev.map((k) => (k.id === item.id ? updated : k)));
    addToast({
      type: 'info',
      title: 'Key Status Changed',
      description: `API Key "${item.name}" is now ${nextStatus.toUpperCase()}.`,
    });
  };

  const handleDeleteKey = async (id: string, name: string) => {
    await apiKeyRepository.delete(id);
    setKeys((prev) => prev.filter((k) => k.id !== id));
    addToast({ type: 'info', title: 'Key Deleted', description: `Deleted API key "${name}".` });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            API Keys & Authentication Management
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Create, rotate, revoke, and track live REST API and WebSocket key tokens for Nexus Voice OS agents.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsGenerateModalOpen(true)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Generate New API Key
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-bold text-zinc-500 uppercase">Active API Keys</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
              {keys.filter((k) => k.status === 'active').length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-bold text-zinc-500 uppercase">24h API Request Volume</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">132,920 Calls</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-bold text-zinc-500 uppercase">Average Latency</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400">38 ms</p>
          </CardContent>
        </Card>
      </div>

      {/* API Keys List */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Secrets & Access Credentials</CardTitle>
          <CardDescription>Each key grants programatic access to agent execution, knowledge vector search, and call control APIs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {keys.map((k) => {
            const isRevealed = !!revealedKeyIds[k.id];

            return (
              <div
                key={k.id}
                className="p-4 border rounded-2xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{k.name}</span>
                    <Badge variant={k.environment === 'production' ? 'primary' : 'warning'} size="sm">
                      {k.environment}
                    </Badge>
                    <Badge variant={k.status === 'active' ? 'success' : 'danger'} size="sm">
                      {k.status}
                    </Badge>
                    <Badge variant="neutral" size="sm">
                      {k.permissions} access
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 w-fit">
                    <Key className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <span>{isRevealed ? k.fullSecret : k.keyPrefix}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleReveal(k.id)}
                      className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    >
                      {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopySecret(k.fullSecret || k.keyPrefix)}
                      className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-zinc-400 flex-wrap">
                    <span>Created: {k.createdDate}</span>
                    <span>•</span>
                    <span>Last Used: {k.lastUsed}</span>
                    <span>•</span>
                    <span>Expires: {k.expiration}</span>
                    <span>•</span>
                    <span className="font-semibold text-emerald-600">{(k.usageCalls || 0).toLocaleString()} Calls</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => handleRotateKey(k)} leftIcon={<RefreshCw className="h-3.5 w-3.5 text-amber-500" />}>
                    Rotate Key
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleToggleStatus(k)}>
                    {k.status === 'active' ? 'Disable' : 'Enable'}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDeleteKey(k.id, k.name)} leftIcon={<Trash2 className="h-3.5 w-3.5" />} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* GENERATE KEY MODAL */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Generate New API Secret Key"
        description="Select environment tier, access permissions scope, and token expiration."
        maxWidth="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsGenerateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleGenerateKey} leftIcon={<Key className="h-4 w-4" />}>
              Generate API Key
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Key Name / Identifier" value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder="e.g. Production Voice Agent Webhook" />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Environment</label>
              <select
                value={keyEnvironment}
                onChange={(e) => setKeyEnvironment(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100"
              >
                <option value="production">Production</option>
                <option value="development">Development</option>
                <option value="staging">Staging</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Permissions Scope</label>
              <select
                value={keyPermissions}
                onChange={(e) => setKeyPermissions(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100"
              >
                <option value="full">Full Read/Write Access</option>
                <option value="restricted">Restricted (Call Trigger Only)</option>
                <option value="read-only">Read-Only Analytics</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Expiration Period</label>
            <select
              value={keyExpiration}
              onChange={(e) => setKeyExpiration(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100"
            >
              <option value="Never">Never Expire</option>
              <option value="30 Days">30 Days</option>
              <option value="90 Days">90 Days</option>
              <option value="1 Year">1 Year</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* NEWLY CREATED KEY DISPLAY MODAL */}
      <Modal
        isOpen={!!newlyCreatedKey}
        onClose={() => setNewlyCreatedKey(null)}
        title="API Key Generated Successfully"
        description="Please copy your secret key now. For security purposes, it will never be displayed again."
        maxWidth="md"
        footer={
          <Button variant="primary" onClick={() => setNewlyCreatedKey(null)}>
            I Have Saved My Secret Key
          </Button>
        }
      >
        {newlyCreatedKey && (
          <div className="space-y-3 p-4 bg-zinc-900 text-zinc-100 rounded-2xl font-mono text-xs">
            <p className="text-zinc-400">// API SECRET TOKEN</p>
            <p className="text-emerald-400 break-all select-all">{newlyCreatedKey.fullSecret}</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 text-white border-zinc-700 hover:bg-zinc-800"
              onClick={() => handleCopySecret(newlyCreatedKey.fullSecret)}
              leftIcon={<Copy className="h-3.5 w-3.5" />}
            >
              Copy Secret Token
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
