import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  CheckCircle2,
  Terminal,
  Code2,
  Play,
  Send,
  Lock,
  Layers,
  Search,
  Sparkles,
  PhoneCall,
  Brain,
  Globe,
  Radio,
  Server,
  ChevronRight,
  ChevronLeft,
  ArrowUpRight,
  FileCode2,
  Boxes,
  Crown,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { CustomSelect } from '../components/ui/CustomSelect';
import { useToast } from '../components/ui/Toast';
import { apiKeyRepository, fetchAPI } from '../repository';
import { ApiKeyItem } from '../types';

interface ApiLogItem {
  id: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | string;
  endpoint: string;
  status: number;
  latency_ms: number;
  ip: string;
  time: string;
  key_prefix: string;
  action?: string;
  resource?: string;
}

interface ApiMetrics {
  active_keys: number;
  total_keys: number;
  max_api_keys?: number;
  api_traffic_24h: number;
  average_latency_ms: number;
  auth_governance: string;
  governance_status: string;
  plan_name?: string;
  plan_key?: string;
  webhook_api_enabled?: boolean;
  api_rate_limit_per_min?: number;
  api_daily_quota?: number;
  api_requests_used_today?: number;
  is_super_admin?: boolean;
  is_custom_override?: boolean;
}

interface SupportedLanguage {
  id: string;
  name: string;
  category: 'Web' | 'Backend' | 'Mobile' | 'Systems' | 'Scripting';
  extension: string;
}

const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { id: 'curl', name: 'cURL', category: 'Web', extension: 'sh' },
  { id: 'javascript', name: 'Node.js', category: 'Web', extension: 'js' },
  { id: 'typescript', name: 'TypeScript', category: 'Web', extension: 'ts' },
  { id: 'python', name: 'Python', category: 'Backend', extension: 'py' },
  { id: 'go', name: 'Go', category: 'Backend', extension: 'go' },
  { id: 'java', name: 'Java', category: 'Backend', extension: 'java' },
  { id: 'csharp', name: 'C# (.NET)', category: 'Backend', extension: 'cs' },
  { id: 'php', name: 'PHP', category: 'Backend', extension: 'php' },
  { id: 'ruby', name: 'Ruby', category: 'Backend', extension: 'rb' },
  { id: 'rust', name: 'Rust', category: 'Systems', extension: 'rs' },
  { id: 'swift', name: 'Swift (iOS)', category: 'Mobile', extension: 'swift' },
  { id: 'kotlin', name: 'Kotlin (Android)', category: 'Mobile', extension: 'kt' },
  { id: 'dart', name: 'Dart / Flutter', category: 'Mobile', extension: 'dart' },
  { id: 'cpp', name: 'C++', category: 'Systems', extension: 'cpp' },
  { id: 'scala', name: 'Scala', category: 'Backend', extension: 'scala' },
  { id: 'powershell', name: 'PowerShell', category: 'Scripting', extension: 'ps1' },
  { id: 'r', name: 'R', category: 'Scripting', extension: 'r' },
];

export interface ApiKeysViewProps {
  onNavigate?: (tab: string) => void;
}

export const ApiKeysView: React.FC<ApiKeysViewProps> = ({ onNavigate }) => {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [metrics, setMetrics] = useState<ApiMetrics>({
    active_keys: 0,
    total_keys: 0,
    api_traffic_24h: 0,
    average_latency_ms: 18.5,
    auth_governance: 'Scoped RBAC',
    governance_status: 'Strict',
  });
  const [recentLogs, setRecentLogs] = useState<ApiLogItem[]>([]);
  const [activeAgents, setActiveAgents] = useState<{ id: string; name: string; language: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [envFilter, setEnvFilter] = useState<'ALL' | 'production' | 'development' | 'staging'>('ALL');

  // Revealed Keys Set
  const [revealedKeyIds, setRevealedKeyIds] = useState<Record<string, boolean>>({});
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Generate Key Modal State
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [keyEnvironment, setKeyEnvironment] = useState<'production' | 'development' | 'staging'>('production');
  const [keyPermissions, setKeyPermissions] = useState<'full' | 'restricted' | 'read-only'>('full');
  const [keyExpiration, setKeyExpiration] = useState('Never');
  const [isGenerating, setIsGenerating] = useState(false);

  // Newly Generated Key Modal State
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<ApiKeyItem | null>(null);

  // Inline Developer Quickstart & Interactive Console State
  const [activeTab, setActiveTab] = useState<'console' | 'code' | 'logs'>('console');
  const [selectedEndpoint, setSelectedEndpoint] = useState<'calls' | 'agents' | 'rag' | 'health'>('calls');
  const [codeLanguage, setCodeLanguage] = useState<string>('curl');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const langScrollRef = useRef<HTMLDivElement>(null);

  const { addToast } = useToast();

  const scrollLanguages = (direction: 'left' | 'right') => {
    if (langScrollRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      langScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [keysData, metricsData, auditData, agentsData] = await Promise.allSettled([
        apiKeyRepository.getAll(),
        fetchAPI('/api/api-keys/metrics'),
        fetchAPI('/api/api-keys/audit-logs?limit=10'),
        fetchAPI('/api/agents'),
      ]);

      if (keysData.status === 'fulfilled' && Array.isArray(keysData.value)) {
        setKeys(keysData.value);
      }
      if (metricsData.status === 'fulfilled' && metricsData.value) {
        setMetrics(metricsData.value);
      }
      if (auditData.status === 'fulfilled' && auditData.value && Array.isArray(auditData.value.logs)) {
        setRecentLogs(auditData.value.logs);
      }
      if (agentsData.status === 'fulfilled' && agentsData.value) {
        const rawList = Array.isArray(agentsData.value)
          ? agentsData.value
          : agentsData.value.agents || [];
        setActiveAgents(rawList);
      }
    } catch {
      // Handled silently
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const handleWorkspaceChange = () => {
      loadData();
    };

    window.addEventListener('createcall:sovereign_target_changed', handleWorkspaceChange);
    window.addEventListener('createcall:tenant_data_updated', handleWorkspaceChange);

    return () => {
      window.removeEventListener('createcall:sovereign_target_changed', handleWorkspaceChange);
      window.removeEventListener('createcall:tenant_data_updated', handleWorkspaceChange);
    };
  }, [loadData]);

  const handleGenerateKey = async () => {
    if (!metrics.is_super_admin && metrics.webhook_api_enabled === false) {
      addToast({
        type: 'error',
        title: 'Plan Upgrade Required',
        description: `Your active plan (${metrics.plan_name || 'Starter Trial'}) does not include Developer REST & WebSocket API access. Please upgrade your plan.`,
      });
      return;
    }

    if (
      !metrics.is_super_admin &&
      metrics.max_api_keys &&
      metrics.active_keys >= metrics.max_api_keys
    ) {
      addToast({
        type: 'error',
        title: 'API Key Limit Reached',
        description: `Your plan allows up to ${metrics.max_api_keys} active keys (${metrics.active_keys} currently active). Please rotate or revoke an existing key, or upgrade your plan.`,
      });
      return;
    }

    if (!keyName.trim()) {
      addToast({ type: 'error', title: 'Validation Error', description: 'API Key name is required.' });
      return;
    }

    try {
      setIsGenerating(true);
      const created = await apiKeyRepository.create({
        name: keyName.trim(),
        environment: keyEnvironment,
        permissions: keyPermissions,
        expiration: keyExpiration,
      });

      setKeys((prev) => [created, ...prev]);
      setIsGenerateModalOpen(false);
      setNewlyCreatedKey(created);
      setKeyName('');
      loadData();
      addToast({
        type: 'success',
        title: 'API Key Generated',
        description: 'Make sure to copy your secret key now. It will not be shown again.',
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Generation Failed', description: err.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleReveal = (id: string) => {
    setRevealedKeyIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopySecret = (secret?: string, keyId?: string) => {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    if (keyId) {
      setCopiedKeyId(keyId);
      setTimeout(() => setCopiedKeyId(null), 2000);
    }
    addToast({ type: 'success', title: 'Copied', description: 'Create Call OS secret token copied to clipboard.' });
  };

  const handleRotateKey = async (item: ApiKeyItem) => {
    try {
      const rotated = await (apiKeyRepository as any).rotate(item.id);
      setKeys((prev) => prev.map((k) => (k.id === item.id ? rotated : k)));
      if (rotated.fullSecret) {
        setNewlyCreatedKey(rotated);
      }
      loadData();
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
    loadData();
    addToast({
      type: 'info',
      title: 'Key Status Changed',
      description: `API Key "${item.name}" is now ${nextStatus.toUpperCase()}.`,
    });
  };

  const handleDeleteKey = async (id: string, name: string) => {
    try {
      await apiKeyRepository.delete(id);
      setKeys((prev) => prev.filter((k) => k.id !== id));
      loadData();
      addToast({ type: 'info', title: 'Key Revoked', description: `Revoked API key "${name}".` });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Revocation Failed', description: err.message });
    }
  };

  // Resolve Real Active Secret Token (Zero static hardcoded fallback)
  const getActiveSecret = () => {
    const active = keys.find((k) => k.status === 'active');
    if (active) {
      return active.fullSecret || active.keyPrefix;
    }
    return 'YOUR_CREATE_CALL_OS_API_KEY';
  };

  // Resolve Real Active Agent Name
  const getActiveAgentName = () => {
    if (activeAgents.length > 0) {
      return activeAgents[0].name;
    }
    return 'Universal_Voice_Assistant';
  };

  // Run live test in Playground
  const handleExecutePlayground = async () => {
    setIsTesting(true);
    try {
      let endpointPath = '/api/calls/outbound';
      let sampleBody: any = {
        phone_number: '+1 (555) 234-5678',
        agent_name: getActiveAgentName(),
        language: 'hi-IN',
      };
      if (selectedEndpoint === 'agents') {
        endpointPath = '/api/agents';
        sampleBody = null;
      } else if (selectedEndpoint === 'rag') {
        endpointPath = '/api/knowledge-base/query';
        sampleBody = { query: 'Enterprise SLA & telephony latency guidelines' };
      } else if (selectedEndpoint === 'health') {
        endpointPath = '/api/health';
        sampleBody = null;
      }

      const res = await fetchAPI('/api/api-keys/test-playground', {
        method: 'POST',
        body: JSON.stringify({
          endpoint: endpointPath,
          method: sampleBody ? 'POST' : 'GET',
          sample_body: sampleBody,
        }),
      });

      setTestResult(res);
      addToast({
        type: 'success',
        title: 'API Response Received',
        description: `${res.endpoint} returned ${res.status_code} OK in ${res.latency_ms}ms`,
      });
      loadData();
    } catch (err: any) {
      setTestResult({
        status_code: 500,
        error: err.message || 'Failed to connect to API endpoint',
      });
      addToast({ type: 'error', title: 'API Test Failed', description: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  // Filtered keys
  const filteredKeys = useMemo(() => {
    return keys.filter((k) => {
      if (envFilter !== 'ALL' && k.environment !== envFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          k.name.toLowerCase().includes(q) ||
          k.keyPrefix.toLowerCase().includes(q) ||
          k.permissions.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [keys, envFilter, searchQuery]);

  // Comprehensive 17+ Languages Code Snippet Generator
  const getCodeSnippet = () => {
    const key = getActiveSecret();
    const host = window.location.origin || 'http://localhost:8000';
    const agentName = getActiveAgentName();

    switch (codeLanguage) {
      case 'curl':
        if (selectedEndpoint === 'calls') {
          return `curl -X POST "${host}/api/calls/outbound" \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone_number": "+1 (555) 234-5678",
    "agent_name": "${agentName}",
    "language": "hi-IN"
  }'`;
        } else if (selectedEndpoint === 'rag') {
          return `curl -X POST "${host}/api/knowledge-base/query" \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "Enterprise SLA and telephony guidelines"}'`;
        } else if (selectedEndpoint === 'agents') {
          return `curl -X GET "${host}/api/agents" \\
  -H "Authorization: Bearer ${key}"`;
        }
        return `curl -X GET "${host}/api/health" \\
  -H "Authorization: Bearer ${key}"`;

      case 'javascript':
        return `import axios from 'axios';

const client = axios.create({
  baseURL: '${host}',
  headers: {
    'Authorization': 'Bearer ${key}',
    'Content-Type': 'application/json'
  }
});

${
  selectedEndpoint === 'calls'
    ? `const response = await client.post('/api/calls/outbound', {
  phone_number: '+1 (555) 234-5678',
  agent_name: '${agentName}',
  language: 'hi-IN'
});
console.log('Call Queued:', response.data);`
    : selectedEndpoint === 'rag'
    ? `const response = await client.post('/api/knowledge-base/query', {
  query: 'Enterprise SLA guidelines'
});
console.log('RAG Vector Matches:', response.data);`
    : selectedEndpoint === 'agents'
    ? `const response = await client.get('/api/agents');
console.log('Active Agents:', response.data);`
    : `const response = await client.get('/api/health');
console.log('System Status:', response.data);`
}`;

      case 'typescript':
        return `import axios, { AxiosResponse } from 'axios';

interface CreateCallOSResponse<T = any> {
  status: string;
  call_id?: string;
  latency_ms?: number;
  data?: T;
}

const client = axios.create({
  baseURL: '${host}',
  headers: {
    Authorization: 'Bearer ${key}',
    'Content-Type': 'application/json',
  },
});

${
  selectedEndpoint === 'calls'
    ? `async function triggerOutboundCall(): Promise<CreateCallOSResponse> {
  const res: AxiosResponse<CreateCallOSResponse> = await client.post('/api/calls/outbound', {
    phone_number: '+1 (555) 234-5678',
    agent_name: '${agentName}',
    language: 'hi-IN',
  });
  return res.data;
}`
    : selectedEndpoint === 'rag'
    ? `async function queryKnowledgeBase(query: string): Promise<CreateCallOSResponse> {
  const res: AxiosResponse<CreateCallOSResponse> = await client.post('/api/knowledge-base/query', { query });
  return res.data;
}`
    : selectedEndpoint === 'agents'
    ? `async function fetchAgents(): Promise<CreateCallOSResponse> {
  const res: AxiosResponse<CreateCallOSResponse> = await client.get('/api/agents');
  return res.data;
}`
    : `async function checkHealth(): Promise<CreateCallOSResponse> {
  const res: AxiosResponse<CreateCallOSResponse> = await client.get('/api/health');
  return res.data;
}`
}`;

      case 'python':
        return `import requests

url = "${host}${
          selectedEndpoint === 'calls'
            ? '/api/calls/outbound'
            : selectedEndpoint === 'rag'
            ? '/api/knowledge-base/query'
            : selectedEndpoint === 'agents'
            ? '/api/agents'
            : '/api/health'
        }"

headers = {
    "Authorization": "Bearer ${key}",
    "Content-Type": "application/json"
}

${
  selectedEndpoint === 'calls'
    ? `payload = {
    "phone_number": "+1 (555) 234-5678",
    "agent_name": "${agentName}",
    "language": "hi-IN"
}
response = requests.post(url, json=payload, headers=headers)`
    : selectedEndpoint === 'rag'
    ? `payload = {"query": "Enterprise SLA guidelines"}
response = requests.post(url, json=payload, headers=headers)`
    : `response = requests.get(url, headers=headers)`
}

print(response.status_code, response.json())`;

      case 'go':
        return `package main

import (
\t"bytes"
\t"encoding/json"
\t"fmt"
\t"net/http"
)

func main() {
\turl := "${host}${
          selectedEndpoint === 'calls'
            ? '/api/calls/outbound'
            : selectedEndpoint === 'rag'
            ? '/api/knowledge-base/query'
            : selectedEndpoint === 'agents'
            ? '/api/agents'
            : '/api/health'
        }"

${
  selectedEndpoint === 'calls'
    ? `\tpayload := map[string]string{
\t\t"phone_number": "+15552345678",
\t\t"agent_name": "${agentName}",
\t\t"language": "hi-IN",
\t}
\tjsonBody, _ := json.Marshal(payload)
\treq, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonBody))`
    : selectedEndpoint === 'rag'
    ? `\tpayload := map[string]string{"query": "Pricing guidelines"}
\tjsonBody, _ := json.Marshal(payload)
\treq, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonBody))`
    : `\treq, _ := http.NewRequest("GET", url, nil)`
}
\treq.Header.Set("Authorization", "Bearer ${key}")
\treq.Header.Set("Content-Type", "application/json")

\tclient := &http.Client{}
\tresp, err := client.Do(req)
\tif err != nil { panic(err) }
\tdefer resp.Body.Close()

\tfmt.Println("Create Call OS Status:", resp.Status)
}`;

      case 'java':
        return `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class CreateCallOSClient {
    public static void main(String[] args) throws Exception {
        String url = "${host}${
          selectedEndpoint === 'calls'
            ? '/api/calls/outbound'
            : selectedEndpoint === 'rag'
            ? '/api/knowledge-base/query'
            : selectedEndpoint === 'agents'
            ? '/api/agents'
            : '/api/health'
        }";

        HttpClient client = HttpClient.newHttpClient();
        ${
          selectedEndpoint === 'calls'
            ? `String body = """
            {
                "phone_number": "+15552345678",
                "agent_name": "${agentName}",
                "language": "hi-IN"
            }
            """;
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .header("Authorization", "Bearer ${key}")
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .build();`
            : selectedEndpoint === 'rag'
            ? `String body = "{\\"query\\": \\"Enterprise guidelines\\"}";
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .header("Authorization", "Bearer ${key}")
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .build();`
            : `HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .header("Authorization", "Bearer ${key}")
            .GET()
            .build();`
        }

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println("Response: " + response.body());
    }
}`;

      case 'csharp':
        return `using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

class Program {
    static async Task Main() {
        using var client = new HttpClient();
        client.DefaultRequestHeaders.Add("Authorization", "Bearer ${key}");

        string url = "${host}${
          selectedEndpoint === 'calls'
            ? '/api/calls/outbound'
            : selectedEndpoint === 'rag'
            ? '/api/knowledge-base/query'
            : selectedEndpoint === 'agents'
            ? '/api/agents'
            : '/api/health'
        }";

${
  selectedEndpoint === 'calls'
    ? `        var json = "{\\"phone_number\\": \\"+15552345678\\", \\"agent_name\\": \\"${agentName}\\", \\"language\\": \\"hi-IN\\"}";
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        var response = await client.PostAsync(url, content);`
    : selectedEndpoint === 'rag'
    ? `        var json = "{\\"query\\": \\"Enterprise SLA\\"}";
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        var response = await client.PostAsync(url, content);`
    : `        var response = await client.GetAsync(url);`
}
        var result = await response.Content.ReadAsStringAsync();
        Console.WriteLine(result);
    }
}`;

      case 'php':
        return `<?php
$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => "${host}${
          selectedEndpoint === 'calls'
            ? '/api/calls/outbound'
            : selectedEndpoint === 'rag'
            ? '/api/knowledge-base/query'
            : selectedEndpoint === 'agents'
            ? '/api/agents'
            : '/api/health'
        }",
    CURLOPT_RETURNTRANSFER => true,
    ${selectedEndpoint === 'calls' || selectedEndpoint === 'rag' ? 'CURLOPT_POST => true,' : ''}
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer ${key}",
        "Content-Type: application/json"
    ],
    ${
      selectedEndpoint === 'calls'
        ? `CURLOPT_POSTFIELDS => json_encode([
        "phone_number" => "+15552345678",
        "agent_name" => "${agentName}",
        "language" => "hi-IN"
    ]),`
        : selectedEndpoint === 'rag'
        ? `CURLOPT_POSTFIELDS => json_encode(["query" => "Enterprise SLA"]),`
        : ''
    }
]);

$response = curl_exec($curl);
curl_close($curl);
echo $response;
?>`;

      case 'ruby':
        return `require 'net/http'
require 'uri'
require 'json'

uri = URI.parse("${host}${
          selectedEndpoint === 'calls'
            ? '/api/calls/outbound'
            : selectedEndpoint === 'rag'
            ? '/api/knowledge-base/query'
            : selectedEndpoint === 'agents'
            ? '/api/agents'
            : '/api/health'
        }")

${
  selectedEndpoint === 'calls'
    ? `request = Net::HTTP::Post.new(uri)
request["Authorization"] = "Bearer ${key}"
request["Content-Type"] = "application/json"
request.body = JSON.dump({
  "phone_number" => "+15552345678",
  "agent_name" => "${agentName}",
  "language" => "hi-IN"
})`
    : selectedEndpoint === 'rag'
    ? `request = Net::HTTP::Post.new(uri)
request["Authorization"] = "Bearer ${key}"
request["Content-Type"] = "application/json"
request.body = JSON.dump({ "query" => "Enterprise SLA" })`
    : `request = Net::HTTP::Get.new(uri)
request["Authorization"] = "Bearer ${key}"`
}

response = Net::HTTP.start(uri.hostname, uri.port) do |http|
  http.request(request)
end

puts response.body`;

      case 'rust':
        return `use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE};
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut headers = HeaderMap::new();
    headers.insert(AUTHORIZATION, HeaderValue::from_str("Bearer ${key}")?);
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));

    let client = reqwest::Client::new();
    let url = "${host}${
          selectedEndpoint === 'calls'
            ? '/api/calls/outbound'
            : selectedEndpoint === 'rag'
            ? '/api/knowledge-base/query'
            : selectedEndpoint === 'agents'
            ? '/api/agents'
            : '/api/health'
        }";

${
  selectedEndpoint === 'calls'
    ? `    let payload = json!({
        "phone_number": "+15552345678",
        "agent_name": "${agentName}",
        "language": "hi-IN"
    });
    let res = client.post(url).headers(headers).json(&payload).send().await?;`
    : selectedEndpoint === 'rag'
    ? `    let payload = json!({ "query": "Enterprise SLA guidelines" });
    let res = client.post(url).headers(headers).json(&payload).send().await?;`
    : `    let res = client.get(url).headers(headers).send().await?;`
}

    println!("Response: {}", res.text().await?);
    Ok(())
}`;

      case 'swift':
        return `import Foundation

guard let url = URL(string: "${host}${
          selectedEndpoint === 'calls'
            ? '/api/calls/outbound'
            : selectedEndpoint === 'rag'
            ? '/api/knowledge-base/query'
            : selectedEndpoint === 'agents'
            ? '/api/agents'
            : '/api/health'
        }") else { return }

var request = URLRequest(url: url)
${selectedEndpoint === 'calls' || selectedEndpoint === 'rag' ? 'request.httpMethod = "POST"' : 'request.httpMethod = "GET"'}
request.setValue("Bearer ${key}", forHTTPHeaderField: "Authorization")
request.setValue("application/json", forHTTPHeaderField: "Content-Type")

${
  selectedEndpoint === 'calls'
    ? `let body: [String: Any] = [
    "phone_number": "+15552345678",
    "agent_name": "${agentName}",
    "language": "hi-IN"
]
request.httpBody = try? JSONSerialization.data(withJSONObject: body)`
    : selectedEndpoint === 'rag'
    ? `let body: [String: Any] = ["query": "Enterprise SLA"]
request.httpBody = try? JSONSerialization.data(withJSONObject: body)`
    : ''
}

let task = URLSession.shared.dataTask(with: request) { data, _, _ in
    if let data = data, let str = String(data: data, encoding: .utf8) {
        print("Create Call OS Response: \\(str)")
    }
}
task.resume()`;

      case 'kotlin':
        return `import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

fun main() {
    val client = OkHttpClient()
    val url = "${host}${
          selectedEndpoint === 'calls'
            ? '/api/calls/outbound'
            : selectedEndpoint === 'rag'
            ? '/api/knowledge-base/query'
            : selectedEndpoint === 'agents'
            ? '/api/agents'
            : '/api/health'
        }"

${
  selectedEndpoint === 'calls'
    ? `    val json = """
        {
            "phone_number": "+15552345678",
            "agent_name": "${agentName}",
            "language": "hi-IN"
        }
    """.trimIndent()
    val mediaType = "application/json; charset=utf-8".toMediaType()
    val request = Request.Builder()
        .url(url)
        .header("Authorization", "Bearer ${key}")
        .post(json.toRequestBody(mediaType))
        .build()`
    : selectedEndpoint === 'rag'
    ? `    val json = """{"query": "Enterprise SLA"}""".trimIndent()
    val mediaType = "application/json; charset=utf-8".toMediaType()
    val request = Request.Builder()
        .url(url)
        .header("Authorization", "Bearer ${key}")
        .post(json.toRequestBody(mediaType))
        .build()`
    : `    val request = Request.Builder()
        .url(url)
        .header("Authorization", "Bearer ${key}")
        .get()
        .build()`
}

    client.newCall(request).execute().use { response ->
        println(response.body?.string())
    }
}`;

      case 'dart':
        return `import 'dart:convert';
import 'package:http/http.dart' as http;

void main() async {
  final url = Uri.parse('${host}${
          selectedEndpoint === 'calls'
            ? '/api/calls/outbound'
            : selectedEndpoint === 'rag'
            ? '/api/knowledge-base/query'
            : selectedEndpoint === 'agents'
            ? '/api/agents'
            : '/api/health'
        }');

${
  selectedEndpoint === 'calls'
    ? `  final response = await http.post(
    url,
    headers: {
      'Authorization': 'Bearer ${key}',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'phone_number': '+15552345678',
      'agent_name': '${agentName}',
      'language': 'hi-IN',
    }),
  );`
    : selectedEndpoint === 'rag'
    ? `  final response = await http.post(
    url,
    headers: {
      'Authorization': 'Bearer ${key}',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({'query': 'Enterprise SLA'}),
  );`
    : `  final response = await http.get(
    url,
    headers: {'Authorization': 'Bearer ${key}'},
  );`
}

  print('Status: \${response.statusCode}');
  print('Body: \${response.body}');
}`;

      case 'cpp':
        return `#include <iostream>
#include <string>
#include <curl/curl.h>

int main() {
    CURL *curl = curl_easy_init();
    if(curl) {
        struct curl_slist *headers = NULL;
        headers = curl_slist_append(headers, "Authorization: Bearer ${key}");
        headers = curl_slist_append(headers, "Content-Type: application/json");

        curl_easy_setopt(curl, CURLOPT_URL, "${host}${
          selectedEndpoint === 'calls'
            ? '/api/calls/outbound'
            : selectedEndpoint === 'rag'
            ? '/api/knowledge-base/query'
            : selectedEndpoint === 'agents'
            ? '/api/agents'
            : '/api/health'
        }");
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);

${
  selectedEndpoint === 'calls'
    ? `        const char *data = "{\\"phone_number\\":\\"+15552345678\\",\\"agent_name\\":\\"${agentName}\\",\\"language\\":\\"hi-IN\\"}";
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, data);`
    : selectedEndpoint === 'rag'
    ? `        const char *data = "{\\"query\\":\\"Enterprise SLA\\"}";
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, data);`
    : ''
}

        CURLcode res = curl_easy_perform(curl);
        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);
    }
    return 0;
}`;

      case 'scala':
        return `import requests._

object CreateCallOSApp extends App {
  val url = "${host}${
          selectedEndpoint === 'calls'
            ? '/api/calls/outbound'
            : selectedEndpoint === 'rag'
            ? '/api/knowledge-base/query'
            : selectedEndpoint === 'agents'
            ? '/api/agents'
            : '/api/health'
        }"

${
  selectedEndpoint === 'calls'
    ? `  val response = requests.post(
    url,
    headers = Map("Authorization" -> "Bearer ${key}", "Content-Type" -> "application/json"),
    data = """{"phone_number": "+15552345678", "agent_name": "${agentName}", "language": "hi-IN"}"""
  )`
    : selectedEndpoint === 'rag'
    ? `  val response = requests.post(
    url,
    headers = Map("Authorization" -> "Bearer ${key}", "Content-Type" -> "application/json"),
    data = """{"query": "Enterprise SLA"}"""
  )`
    : `  val response = requests.get(
    url,
    headers = Map("Authorization" -> "Bearer ${key}")
  )`
}
  println(response.text())
}`;

      case 'powershell':
        return `$Headers = @{
    "Authorization" = "Bearer ${key}"
    "Content-Type"  = "application/json"
}

$Url = "${host}${
          selectedEndpoint === 'calls'
            ? '/api/calls/outbound'
            : selectedEndpoint === 'rag'
            ? '/api/knowledge-base/query'
            : selectedEndpoint === 'agents'
            ? '/api/agents'
            : '/api/health'
        }"

${
  selectedEndpoint === 'calls'
    ? `$Body = @{
    phone_number = "+1 (555) 234-5678"
    agent_name   = "${agentName}"
    language     = "hi-IN"
} | ConvertTo-Json

$Response = Invoke-RestMethod -Uri $Url -Method Post -Headers $Headers -Body $Body`
    : selectedEndpoint === 'rag'
    ? `$Body = @{ query = "Enterprise SLA" } | ConvertTo-Json
$Response = Invoke-RestMethod -Uri $Url -Method Post -Headers $Headers -Body $Body`
    : `$Response = Invoke-RestMethod -Uri $Url -Method Get -Headers $Headers`
}
$Response | Format-List`;

      case 'r':
        return `library(httr2)

req <- request("${host}${
          selectedEndpoint === 'calls'
            ? '/api/calls/outbound'
            : selectedEndpoint === 'rag'
            ? '/api/knowledge-base/query'
            : selectedEndpoint === 'agents'
            ? '/api/agents'
            : '/api/health'
        }") %>%
  req_headers(
    "Authorization" = "Bearer ${key}",
    "Content-Type"  = "application/json"
  )

${
  selectedEndpoint === 'calls'
    ? `req <- req %>% req_body_json(list(
  phone_number = "+15552345678",
  agent_name   = "${agentName}",
  language     = "hi-IN"
))`
    : selectedEndpoint === 'rag'
    ? `req <- req %>% req_body_json(list(query = "Enterprise SLA"))`
    : ''
}

resp <- req_perform(req)
resp_body_json(resp)`;

      default:
        return `curl -X GET "${host}/api/health" -H "Authorization: Bearer ${key}"`;
    }
  };

  return (
    <div className="space-y-4 pb-12 max-w-full">
      {/* 1. Header with 2-Row Layout */}
      <div className="space-y-1.5 border-b border-zinc-200/80 dark:border-zinc-800 pb-2.5 shrink-0">
        {/* ROW 1: Heading on Left + Badges on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/25 shrink-0">
              <Key className="h-3.5 w-3.5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 whitespace-nowrap leading-none">
              API Keys &amp; Developer Authentication
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Badge
              variant={
                metrics.is_super_admin
                  ? 'amber'
                  : metrics.webhook_api_enabled
                  ? 'emerald'
                  : 'neutral'
              }
              className="text-xs font-semibold px-2.5 py-1 flex items-center gap-1.5 shadow-2xs"
            >
              {metrics.is_super_admin ? (
                <Crown className="h-3.5 w-3.5 text-amber-500" />
              ) : metrics.webhook_api_enabled ? (
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Lock className="h-3.5 w-3.5 text-amber-500" />
              )}
              <span>{metrics.plan_name || 'Starter Trial'}</span>
            </Badge>

            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/60 shadow-2xs">
              <Shield className="h-3 w-3 text-emerald-500" />
              <span>Live &amp; Test Keys</span>
            </div>
          </div>
        </div>

        {/* ROW 2: Description on Left + Action Buttons on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Create, rotate, revoke, and test live REST &amp; WebSocket token credentials for Create Call OS autonomous agents.
          </p>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-teal-500' : ''}`} />}
              className="h-7.5 text-xs font-semibold px-2.5 shadow-2xs"
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsGenerateModalOpen(true)}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              className="h-7.5 text-xs font-semibold px-2.5 shadow-2xs"
            >
              Generate New API Key
            </Button>
          </div>
        </div>
      </div>

      {/* 1.5 SINGLE UNIFIED ACTIVE PLAN & API ENTITLEMENTS STATUS BANNER */}
      <div className={`p-3.5 rounded-2xl border shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5 ${
        !metrics.webhook_api_enabled && !metrics.is_super_admin
          ? 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/30'
          : 'bg-white dark:bg-zinc-900 border-zinc-200/90 dark:border-zinc-800'
      }`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2.5 rounded-xl border shrink-0 ${
            metrics.is_super_admin
              ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
              : metrics.webhook_api_enabled
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
          }`}>
            {metrics.is_super_admin ? (
              <Crown className="h-5 w-5" />
            ) : metrics.webhook_api_enabled ? (
              <ShieldCheck className="h-5 w-5" />
            ) : (
              <Lock className="h-5 w-5" />
            )}
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Plan Entitlements:
              </span>
              <Badge
                variant={
                  metrics.is_super_admin
                    ? 'amber'
                    : metrics.webhook_api_enabled
                    ? 'emerald'
                    : 'amber'
                }
                className="text-[10px] font-mono font-bold"
              >
                {metrics.plan_name || 'Starter Trial'}
              </Badge>
              {!metrics.webhook_api_enabled && !metrics.is_super_admin && (
                <Badge variant="amber" className="text-[9px] font-mono uppercase font-bold">
                  Restricted Access
                </Badge>
              )}
              {metrics.is_custom_override && (
                <Badge variant="blue" className="text-[9px] font-mono">
                  Custom Admin Override
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">
              {metrics.is_super_admin
                ? 'Super Admin Sovereign Access — Unlimited API keys, high-throughput routing & real-time telemetry'
                : metrics.webhook_api_enabled
                ? 'Authorized for Developer REST, WebSockets & Real-time Event Webhooks'
                : 'Developer API locked on Starter Trial. Upgrade to Pro Scale Plan or higher to generate live keys & stream WebSockets.'}
            </p>
          </div>
        </div>

        {/* Right side: Compact Quotas & Limits Chips + Single Upgrade CTA */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-mono shrink-0">
          {/* Key Allocation Progress */}
          <div className="px-2.5 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 flex items-center gap-1.5 shadow-2xs">
            <Key className="h-3.5 w-3.5 text-teal-500" />
            <span className="text-zinc-500">Keys:</span>
            <span
              className={`font-bold ${
                metrics.max_api_keys &&
                metrics.active_keys >= metrics.max_api_keys &&
                !metrics.is_super_admin
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-zinc-900 dark:text-zinc-100'
              }`}
            >
              {metrics.active_keys} /{' '}
              {metrics.max_api_keys && metrics.max_api_keys >= 9999
                ? '∞'
                : metrics.max_api_keys || (metrics.webhook_api_enabled ? 5 : 1)}
            </span>
          </div>

          {/* Rate Limit */}
          <div className="px-2.5 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 flex items-center gap-1.5 shadow-2xs">
            <Zap className="h-3.5 w-3.5 text-sky-500" />
            <span className="text-zinc-500">Rate:</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100">
              {metrics.api_rate_limit_per_min || 60} req/m
            </span>
          </div>

          {/* Daily Quota */}
          <div className="px-2.5 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 flex items-center gap-1.5 shadow-2xs">
            <Activity className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-zinc-500">Daily:</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100">
              {metrics.api_requests_used_today || 0} /{' '}
              {(metrics.api_daily_quota || (metrics.webhook_api_enabled ? 25000 : 1000)).toLocaleString()}
            </span>
          </div>

          {(!metrics.webhook_api_enabled ||
            (metrics.max_api_keys &&
              metrics.active_keys >= metrics.max_api_keys &&
              !metrics.is_super_admin)) && (
            <Button
              size="xs"
              variant="primary"
              onClick={() => {
                if (onNavigate) onNavigate('billing');
                else window.location.href = '#billing';
              }}
              leftIcon={<Crown className="h-3.5 w-3.5 text-amber-300" />}
              className="h-7.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer"
            >
              Upgrade Plan
            </Button>
          )}
        </div>
      </div>

      {/* 2. Interactive High-Tech Metric Cards (100% Real Dynamic Workspace Metrics & Clickable Navigation) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Active Keys */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            const el = document.getElementById('api-keys-section');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else if (keys.length === 0) {
              setIsGenerateModalOpen(true);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              const el = document.getElementById('api-keys-section');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
          title="Click to jump to Organization Credentials & Access Tokens"
          className="p-3 bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 hover:border-teal-500/60 dark:hover:border-teal-500/60 rounded-xl shadow-xs cursor-pointer group transition-all hover:shadow-md hover:bg-teal-50/20 dark:hover:bg-teal-950/20"
        >
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
              Active API Keys
            </span>
            <div className="flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Key className="h-3.5 w-3.5 text-teal-500" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
              {metrics.active_keys}
            </span>
            <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400 bg-teal-500/10 px-1.5 py-0.2 rounded font-medium">
              {metrics.total_keys} total
            </span>
          </div>
        </div>

        {/* 24h Request Volume */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            setActiveTab('logs');
            const el = document.getElementById('dev-console-section');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setActiveTab('logs');
              const el = document.getElementById('dev-console-section');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
          title="Click to view 24H API Traffic & Recent Auth Requests"
          className="p-3 bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 rounded-xl shadow-xs cursor-pointer group transition-all hover:shadow-md hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20"
        >
          <div className="flex items-center justify-between text-emerald-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              24H API Traffic
            </span>
            <div className="flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Activity className="h-3.5 w-3.5 text-emerald-500" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {metrics.api_traffic_24h.toLocaleString()}
            </span>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded font-medium">
              events/day
            </span>
          </div>
        </div>

        {/* Average Latency */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            setActiveTab('console');
            const el = document.getElementById('dev-console-section');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setActiveTab('console');
              const el = document.getElementById('dev-console-section');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
          title="Click to launch Live Test Runner & test API latency"
          className="p-3 bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 hover:border-sky-500/60 dark:hover:border-sky-500/60 rounded-xl shadow-xs cursor-pointer group transition-all hover:shadow-md hover:bg-sky-50/20 dark:hover:bg-sky-950/20"
        >
          <div className="flex items-center justify-between text-sky-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
              Average Latency
            </span>
            <div className="flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Zap className="h-3.5 w-3.5 text-sky-500" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-sky-600 dark:text-sky-400">
              {metrics.average_latency_ms} ms
            </span>
            <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400 bg-sky-500/10 px-1.5 py-0.2 rounded font-medium">
              neural
            </span>
          </div>
        </div>

        {/* Security Tier */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsGenerateModalOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') setIsGenerateModalOpen(true);
          }}
          title="Click to configure Scoped RBAC permissions"
          className="p-3 bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 hover:border-purple-500/60 dark:hover:border-purple-500/60 rounded-xl shadow-xs cursor-pointer group transition-all hover:shadow-md hover:bg-purple-50/20 dark:hover:bg-purple-950/20"
        >
          <div className="flex items-center justify-between text-purple-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              Auth Governance
            </span>
            <div className="flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Shield className="h-3.5 w-3.5 text-purple-500" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-base font-bold font-mono text-purple-700 dark:text-purple-300 truncate">
              {metrics.auth_governance}
            </span>
            <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 bg-purple-500/10 px-1.5 py-0.2 rounded font-medium">
              {metrics.governance_status}
            </span>
          </div>
        </div>
      </div>

      {/* 3. INLINE DEVELOPER PLAYGROUND & LIVE CONSOLE */}
      <Card id="dev-console-section" className="border-teal-500/30 dark:border-teal-500/20 bg-gradient-to-br from-teal-50/20 via-white to-transparent dark:from-teal-950/20 dark:via-zinc-900 dark:to-transparent shadow-sm overflow-hidden scroll-mt-6">
        <div className="px-4 py-3 border-b border-zinc-200/80 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Terminal className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Create Call OS Developer Console & SDK Tester
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Execute authenticated HTTP requests directly with your active create_call_os tokens.
              </p>
            </div>
          </div>

          {/* Console Tab Selector */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-850 p-1 rounded-xl text-xs font-mono border border-zinc-200/80 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setActiveTab('console')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                activeTab === 'console'
                  ? 'bg-teal-600 text-white font-bold shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/70 dark:hover:bg-zinc-750 font-medium'
              }`}
            >
              Live Test Runner
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'code'
                  ? 'bg-teal-600 text-white font-bold shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/70 dark:hover:bg-zinc-750 font-medium'
              }`}
            >
              <FileCode2 className="h-3.5 w-3.5" />
              <span>17+ SDK Snippets</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-teal-600 text-white font-bold shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/70 dark:hover:bg-zinc-750 font-medium'
              }`}
            >
              Recent Auth Requests ({recentLogs.length})
            </button>
          </div>
        </div>

        <CardContent className="p-4 space-y-3.5">
          {/* TAB 1: LIVE TEST RUNNER */}
          {activeTab === 'console' && (
            <div className="space-y-3">
              {/* Endpoint selection pills */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => { setSelectedEndpoint('calls'); setTestResult(null); }}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    selectedEndpoint === 'calls'
                      ? 'bg-teal-600 text-white font-bold shadow-xs border border-teal-500'
                      : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <PhoneCall className="h-3.5 w-3.5" />
                  <span>POST /api/calls/outbound</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setSelectedEndpoint('agents'); setTestResult(null); }}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    selectedEndpoint === 'agents'
                      ? 'bg-teal-600 text-white font-bold shadow-xs border border-teal-500'
                      : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Brain className="h-3.5 w-3.5" />
                  <span>GET /api/agents</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setSelectedEndpoint('rag'); setTestResult(null); }}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    selectedEndpoint === 'rag'
                      ? 'bg-teal-600 text-white font-bold shadow-xs border border-teal-500'
                      : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>POST /api/knowledge-base/query</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setSelectedEndpoint('health'); setTestResult(null); }}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    selectedEndpoint === 'health'
                      ? 'bg-teal-600 text-white font-bold shadow-xs border border-teal-500'
                      : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Server className="h-3.5 w-3.5" />
                  <span>GET /api/health</span>
                </button>
              </div>

              {/* Action and output bar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Request Payload Preview */}
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono space-y-2">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                      HTTP Request Header & Payload:
                    </span>
                    <Button
                      size="xs"
                      variant="primary"
                      onClick={handleExecutePlayground}
                      loading={isTesting}
                      leftIcon={<Play className="h-3 w-3 fill-current" />}
                      className="text-xs h-6.5"
                    >
                      Send Request
                    </Button>
                  </div>
                  <pre className="text-zinc-300 text-[11px] leading-relaxed overflow-x-auto">
                    {`Authorization: Bearer ${getActiveSecret()}\nContent-Type: application/json\n\n`}
                    {selectedEndpoint === 'calls'
                      ? JSON.stringify(
                          {
                            phone_number: '+1 (555) 234-5678',
                            agent_name: getActiveAgentName(),
                            language: 'hi-IN',
                          },
                          null,
                          2
                        )
                      : selectedEndpoint === 'rag'
                      ? JSON.stringify({ query: 'Enterprise SLA & telephony latency guidelines' }, null, 2)
                      : '// No request body required (GET)'}
                  </pre>
                </div>

                {/* Live Response Box */}
                <div className="p-3 rounded-xl bg-[#090d16] border border-zinc-800 text-xs font-mono space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Live Response:
                    </span>
                    {testResult && (
                      <span className="text-[10px] text-zinc-400">
                        Latency: <span className="text-teal-400 font-semibold">{testResult.latency_ms} ms</span>
                      </span>
                    )}
                  </div>
                  <pre className="text-zinc-300 text-[11px] leading-relaxed overflow-x-auto max-h-40 scrollbar-thin">
                    {testResult
                      ? JSON.stringify(testResult.response, null, 2)
                      : '// Click "Send Request" to execute live authenticated API call...'}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CODE SNIPPETS (17+ POPULAR LANGUAGES) */}
          {activeTab === 'code' && (
            <div className="space-y-3">
              {/* Language Selector Header & Copy Button */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-zinc-200/60 dark:border-zinc-800/80">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
                    Select Language ({SUPPORTED_LANGUAGES.length} Available):
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => handleCopySecret(getCodeSnippet())}
                    leftIcon={<Copy className="h-3 w-3" />}
                    className="text-xs h-7"
                  >
                    Copy Snippet
                  </Button>
                </div>
              </div>

              {/* 17 Languages Single-Line Capsule Box with Left/Right Navigation & Zero Visible Scrollbar */}
              <div className="relative flex items-center gap-1.5 p-1.5 rounded-xl bg-zinc-100/90 dark:bg-zinc-950/80 border border-zinc-200/90 dark:border-zinc-800/90 shadow-inner">
                <button
                  type="button"
                  onClick={() => scrollLanguages('left')}
                  aria-label="Scroll left"
                  className="shrink-0 p-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-500/40 shadow-xs cursor-pointer transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div
                  ref={langScrollRef}
                  className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex-nowrap scroll-smooth py-0.5 px-0.5 w-full select-none"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {SUPPORTED_LANGUAGES.map((lang) => {
                    const isSelected = codeLanguage === lang.id;
                    return (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => setCodeLanguage(lang.id)}
                        className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-teal-600 text-white font-bold border-teal-500 shadow-xs ring-1 ring-teal-400/30 dark:bg-teal-500 dark:text-zinc-950 dark:border-teal-400'
                            : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200/90 dark:border-zinc-800/90 hover:border-teal-500/50 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50/40 dark:hover:bg-zinc-850 shadow-2xs'
                        }`}
                      >
                        {lang.name}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => scrollLanguages('right')}
                  aria-label="Scroll right"
                  className="shrink-0 p-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-500/40 shadow-xs cursor-pointer transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Code Snippet Box */}
              <div className="relative rounded-2xl bg-[#090d16] p-4 font-mono text-xs text-teal-300 border border-zinc-800/90 overflow-x-auto shadow-inner">
                <div className="flex items-center justify-between text-[11px] text-zinc-500 pb-2 mb-2 border-b border-zinc-800/60 font-mono">
                  <span>
                    Endpoint:{' '}
                    <span className="text-zinc-300 font-semibold">
                      {selectedEndpoint === 'calls'
                        ? 'POST /api/calls/outbound'
                        : selectedEndpoint === 'rag'
                        ? 'POST /api/knowledge-base/query'
                        : selectedEndpoint === 'agents'
                        ? 'GET /api/agents'
                        : 'GET /api/health'}
                    </span>
                  </span>
                  <span className="text-zinc-400 uppercase text-[10px]">
                    SDK: {SUPPORTED_LANGUAGES.find((l) => l.id === codeLanguage)?.name}
                  </span>
                </div>
                <pre className="text-zinc-200 text-[11.5px] leading-relaxed select-all">
                  {getCodeSnippet()}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: RECENT AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 text-[10px] uppercase">
                  <tr>
                    <th className="py-2 px-3">Method</th>
                    <th className="py-2 px-3">Endpoint / Resource</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Latency</th>
                    <th className="py-2 px-3">Key Prefix</th>
                    <th className="py-2 px-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-850">
                  {recentLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-zinc-500">
                        No recent API requests recorded for this workspace.
                      </td>
                    </tr>
                  ) : (
                    recentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/60 transition-colors">
                        <td className="py-2 px-3">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400">
                            {log.method}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-zinc-800 dark:text-zinc-200 font-medium">
                          {log.resource || log.endpoint}
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{log.status} OK</span>
                        </td>
                        <td className="py-2 px-3 text-zinc-500">{log.latency_ms} ms</td>
                        <td className="py-2 px-3 text-zinc-400">{log.key_prefix}...</td>
                        <td className="py-2 px-3 text-right text-zinc-400">{log.time}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. API Keys Section (2 CARDS PER ROW GRID) */}
      <Card id="api-keys-section" className="border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden scroll-mt-6">
        <CardHeader className="bg-zinc-50/70 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold">Organization Credentials & Access Tokens</CardTitle>
              <CardDescription className="text-xs">
                Each token grants bearer authorization to telephony workflows, speech models, and knowledge vector databases.
              </CardDescription>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => setEnvFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                  envFilter === 'ALL'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-850 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                }`}
              >
                All ({keys.length})
              </button>
              <button
                type="button"
                onClick={() => setEnvFilter('production')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                  envFilter === 'production'
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'
                }`}
              >
                Production
              </button>
              <button
                type="button"
                onClick={() => setEnvFilter('development')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                  envFilter === 'development'
                    ? 'bg-amber-600 text-white font-semibold shadow-xs'
                    : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100'
                }`}
              >
                Development
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          {filteredKeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-zinc-500 space-y-2">
              <Key className="h-8 w-8 text-zinc-400" />
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No API keys found</p>
              <p className="text-xs text-zinc-500">Generate a new API key to begin integrating Create Call OS into your applications.</p>
              <Button size="sm" variant="primary" onClick={() => setIsGenerateModalOpen(true)} className="mt-2 text-xs">
                Generate First Key
              </Button>
            </div>
          ) : (
            /* 2 KEYS PER ROW (grid-cols-1 md:grid-cols-2) */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
              {filteredKeys.map((k) => {
                const isRevealed = !!revealedKeyIds[k.id];
                const isCopied = copiedKeyId === k.id;

                return (
                  <div
                    key={k.id}
                    className="p-4 border rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 hover:border-teal-500/50 dark:hover:border-teal-500/50 transition-all flex flex-col justify-between gap-3.5 shadow-2xs group"
                  >
                    {/* Top Row: Key Name & Badges */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">{k.name}</span>
                          <Badge
                            variant={
                              k.environment === 'production'
                                ? 'emerald'
                                : k.environment === 'development'
                                ? 'amber'
                                : 'neutral'
                            }
                            className="text-[10px] uppercase font-mono"
                          >
                            {k.environment}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant={k.status === 'active' ? 'emerald' : 'danger'}
                            className="text-[10px] uppercase font-mono"
                          >
                            {k.status}
                          </Badge>
                          <Badge variant="neutral" className="text-[10px] font-mono">
                            {k.permissions}
                          </Badge>
                        </div>
                      </div>

                      {/* Monospace Token Box */}
                      <div className="flex items-center justify-between gap-2 font-mono text-xs text-zinc-700 dark:text-zinc-200 bg-zinc-100/90 dark:bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 w-full">
                        <div className="flex items-center gap-2 truncate">
                          <Key className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                          <span className="select-all font-semibold truncate text-[11.5px]">
                            {isRevealed ? k.fullSecret || k.keyPrefix : k.keyPrefix}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleReveal(k.id)}
                            title={isRevealed ? 'Hide Secret' : 'Reveal Secret'}
                            className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
                          >
                            {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopySecret(k.fullSecret || k.keyPrefix, k.id)}
                            title="Copy Key Token"
                            className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
                          >
                            {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Metadata Line */}
                      <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono flex-wrap pt-0.5">
                        <span>Created: {k.createdDate}</span>
                        <span>•</span>
                        <span>Last Used: {k.lastUsed}</span>
                        <span>•</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {(k.usageCalls || 0).toLocaleString()} Calls
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleRotateKey(k)}
                        leftIcon={<RefreshCw className="h-3 w-3 text-amber-500" />}
                        className="text-xs h-7"
                      >
                        Rotate Key
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleToggleStatus(k)}
                        className="text-xs h-7"
                      >
                        {k.status === 'active' ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        size="xs"
                        variant="danger"
                        onClick={() => handleDeleteKey(k.id, k.name)}
                        leftIcon={<Trash2 className="h-3 w-3" />}
                        className="h-7"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5. GENERATE KEY MODAL */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Generate New Create Call OS API Key"
        description="Select environment tier, access permissions scope, and token expiration."
        maxWidth="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsGenerateModalOpen(false)}>
              Cancel
            </Button>
            {!metrics.webhook_api_enabled && !metrics.is_super_admin ? (
              <Button
                variant="primary"
                onClick={() => {
                  setIsGenerateModalOpen(false);
                  if (onNavigate) onNavigate('billing');
                  else window.location.href = '#billing';
                }}
                leftIcon={<Crown className="h-4 w-4" />}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Upgrade Plan to Unlock
              </Button>
            ) : metrics.max_api_keys &&
              metrics.active_keys >= metrics.max_api_keys &&
              !metrics.is_super_admin ? (
              <Button
                variant="primary"
                onClick={() => {
                  setIsGenerateModalOpen(false);
                  if (onNavigate) onNavigate('billing');
                  else window.location.href = '#billing';
                }}
                leftIcon={<Sparkles className="h-4 w-4" />}
              >
                Upgrade For More Keys
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleGenerateKey}
                loading={isGenerating}
                leftIcon={<Key className="h-4 w-4" />}
              >
                Generate API Key
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-4">
          {/* Plan Entitlement Info Box */}
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Plan:</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                {metrics.plan_name || 'Pro Scale Plan'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Allocation:</span>
              <span
                className={`font-bold ${
                  metrics.max_api_keys &&
                  metrics.active_keys >= metrics.max_api_keys &&
                  !metrics.is_super_admin
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {metrics.active_keys} /{' '}
                {metrics.max_api_keys && metrics.max_api_keys >= 9999
                  ? '∞'
                  : metrics.max_api_keys || 5}{' '}
                Active
              </span>
            </div>
          </div>

          {!metrics.webhook_api_enabled && !metrics.is_super_admin && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Developer API Access Locked</p>
                <p className="text-[11px] mt-0.5 text-zinc-600 dark:text-zinc-400">
                  Your current plan ({metrics.plan_name || 'Starter Trial'}) does not include programmatic API access. Upgrade to Pro Scale Plan or higher to provision API keys.
                </p>
              </div>
            </div>
          )}

          {metrics.webhook_api_enabled &&
            metrics.max_api_keys &&
            metrics.active_keys >= metrics.max_api_keys &&
            !metrics.is_super_admin && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Key Quota Reached</p>
                  <p className="text-[11px] mt-0.5 text-zinc-600 dark:text-zinc-400">
                    You have active {metrics.active_keys} of {metrics.max_api_keys} allowed keys. Revoke an existing key or upgrade your plan to provision more tokens.
                  </p>
                </div>
              </div>
            )}

          <Input
            label="Key Name / Identifier"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            placeholder="e.g. Production Webhook Integration"
            disabled={!metrics.webhook_api_enabled && !metrics.is_super_admin}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Environment</label>
              <CustomSelect
                value={keyEnvironment}
                onChange={(val) => setKeyEnvironment(val as any)}
                options={[
                  {
                    value: 'production',
                    label: 'Production (Live) — create_call_os_live_...',
                    badge: 'Live',
                  },
                  {
                    value: 'development',
                    label: 'Development (Test) — create_call_os_test_...',
                    badge: 'Test',
                  },
                  {
                    value: 'staging',
                    label: 'Staging (Sandbox) — create_call_os_test_...',
                    badge: 'Staging',
                  },
                ]}
                size="sm"
                className="w-full"
                disabled={!metrics.webhook_api_enabled && !metrics.is_super_admin}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Permissions Scope</label>
              <CustomSelect
                value={keyPermissions}
                onChange={(val) => setKeyPermissions(val as any)}
                options={[
                  {
                    value: 'full',
                    label: 'Full Read/Write Access',
                    badge: 'All Endpoints',
                  },
                  {
                    value: 'restricted',
                    label: 'Restricted (Call Triggers Only)',
                    badge: 'Outbound Only',
                  },
                  {
                    value: 'read-only',
                    label: 'Read-Only (Analytics & Logs)',
                    badge: 'Read Only',
                  },
                ]}
                size="sm"
                className="w-full"
                disabled={!metrics.webhook_api_enabled && !metrics.is_super_admin}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Expiration Period</label>
            <CustomSelect
              value={keyExpiration}
              onChange={(val) => setKeyExpiration(val)}
              options={[
                { value: 'Never', label: 'Never Expire (Permanent Production Token)', badge: 'Recommended' },
                { value: '30 Days', label: '30 Days (Automated Security Rotation)' },
                { value: '90 Days', label: '90 Days (Quarterly Lifecycle)' },
                { value: '1 Year', label: '1 Year (Annual Expiration)' },
              ]}
              size="sm"
              className="w-full"
              disabled={!metrics.webhook_api_enabled && !metrics.is_super_admin}
            />
          </div>
        </div>
      </Modal>

      {/* 6. NEWLY CREATED KEY DISPLAY MODAL */}
      <Modal
        isOpen={!!newlyCreatedKey}
        onClose={() => setNewlyCreatedKey(null)}
        title="Create Call OS API Key Generated"
        description="Please copy your secret key now. For security purposes, it will never be displayed in full again."
        maxWidth="md"
        footer={
          <Button variant="primary" onClick={() => setNewlyCreatedKey(null)}>
            I Have Saved My Secret Key
          </Button>
        }
      >
        {newlyCreatedKey && (
          <div className="space-y-3 p-4 bg-zinc-950 text-zinc-100 rounded-2xl font-mono text-xs border border-zinc-800">
            <p className="text-zinc-400">// CREATE CALL OS SECRET TOKEN</p>
            <p className="text-emerald-400 break-all select-all font-bold text-sm bg-zinc-900 p-2.5 rounded-lg border border-zinc-800">
              {newlyCreatedKey.fullSecret}
            </p>
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
