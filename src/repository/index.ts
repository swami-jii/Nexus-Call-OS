import {
  Agent,
  Campaign,
  Contact,
  PhoneNumber,
  KnowledgeDocument,
  Workflow,
  Integration,
  CallLog,
} from '../types';
import { fetchAPI } from '../lib/api';
export { fetchAPI };

function ensureArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.agents)) return data.agents;
    if (Array.isArray(data.keys)) return data.keys;
    if (Array.isArray(data.credentials)) return data.credentials;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.campaigns)) return data.campaigns;
    if (Array.isArray(data.contacts)) return data.contacts;
    if (Array.isArray(data.phone_numbers)) return data.phone_numbers;
    if (Array.isArray(data.workflows)) return data.workflows;
    if (Array.isArray(data.integrations)) return data.integrations;
    if (Array.isArray(data.coupons)) return data.coupons;
    if (Array.isArray(data.plans)) return data.plans;
    if (Array.isArray(data.payment_methods)) return data.payment_methods;
  }
  return [];
}


// -------------------------------------------------------------
// Domain Specific Repositories
// -------------------------------------------------------------

class ApiAgentRepository {
  private mapToFrontend(backendAgent: any): Agent {
    return {
      id: backendAgent.id,
      name: backendAgent.name,
      role: backendAgent.description || 'Assistant',
      voice: backendAgent.voice_id || 'ElevenLabs',
      llmModel: backendAgent.llm_model || 'Gemini 1.5 Pro',
      language: backendAgent.language || 'en-US',
      status: (backendAgent.status as any) || 'active',
      totalCalls: 0,
      avgDuration: '0m 0s',
      successRate: 0,
      systemPrompt: backendAgent.system_prompt || '',
      temperature: backendAgent.temperature || 0.7,
      maxDurationSeconds: 3600,
      updatedAt: backendAgent.updated_at || new Date().toISOString(),
    };
  }

  private mapToBackend(frontendAgent: Partial<Agent>): any {
    const data: any = {};
    if (frontendAgent.name !== undefined) data.name = frontendAgent.name;
    if (frontendAgent.role !== undefined) data.description = frontendAgent.role;
    if (frontendAgent.voice !== undefined) data.voice_id = frontendAgent.voice;
    if (frontendAgent.llmModel !== undefined) data.llm_model = frontendAgent.llmModel;
    if (frontendAgent.language !== undefined) data.language = frontendAgent.language;
    if (frontendAgent.status !== undefined) data.status = frontendAgent.status;
    if (frontendAgent.systemPrompt !== undefined) data.system_prompt = frontendAgent.systemPrompt;
    if (frontendAgent.temperature !== undefined) data.temperature = frontendAgent.temperature;
    return data;
  }

  async getAll(): Promise<Agent[]> {
    const response = await fetchAPI('/api/agents?page_size=100');
    return response.items.map(this.mapToFrontend);
  }

  async getById(id: string): Promise<Agent | null> {
    try {
      const response = await fetchAPI(`/api/agents/${id}`);
      return this.mapToFrontend(response);
    } catch {
      return null;
    }
  }

  async create(newItem: Omit<Agent, 'id'> & Partial<{ id: string }>): Promise<Agent> {
    const payload = this.mapToBackend(newItem);
    if (!payload.name) payload.name = 'New Agent';
    const response = await fetchAPI('/api/agents', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return this.mapToFrontend(response);
  }

  async update(id: string, updates: Partial<Agent>): Promise<Agent> {
    const payload = this.mapToBackend(updates);
    const response = await fetchAPI(`/api/agents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return this.mapToFrontend(response);
  }

  async delete(id: string): Promise<void> {
    await fetchAPI(`/api/agents/${id}`, { method: 'DELETE' });
  }

  async deleteBulk(ids: string[]): Promise<void> {
    await Promise.all(ids.map(id => this.delete(id).catch(e => console.error(e))));
  }

  async importCSV(rows: Partial<Agent>[]): Promise<Agent[]> {
    const created: Agent[] = [];
    for (const row of rows) {
      created.push(await this.create(row as Omit<Agent, 'id'>));
    }
    return created;
  }
}

export const agentRepository = new ApiAgentRepository();

class ApiCallHistoryRepository {
  private mapToFrontend(backendCall: any): CallLog {
    let transcriptData: any = [];
    try {
      transcriptData = backendCall.transcript ? JSON.parse(backendCall.transcript) : [];
    } catch {
      transcriptData = [];
    }
    
    return {
      id: backendCall.id,
      agentName: backendCall.agent_id ? 'Configured Agent' : 'Unknown Agent',
      contactName: 'Unknown Contact', // Missing in backend, could join
      contactPhone: backendCall.phone_number || '',
      direction: (backendCall.direction?.toLowerCase() || 'outbound') as any,
      durationSeconds: backendCall.duration || 0,
      status: (backendCall.status?.toLowerCase() || 'completed') as any,
      sentiment: (backendCall.sentiment?.toLowerCase() || 'neutral') as any,
      cost: backendCall.cost || 0,
      timestamp: backendCall.created_at || new Date().toISOString(),
      summary: 'Call summary not available', // Mocks
      transcript: Array.isArray(transcriptData) ? transcriptData : [],
      recordingUrl: backendCall.recording_url || undefined,
      latencyMs: 250, // Mock latency
    };
  }

  private mapToBackend(frontendCall: Partial<CallLog>): any {
    const data: any = {};
    if (frontendCall.contactPhone !== undefined) data.phone_number = frontendCall.contactPhone;
    if (frontendCall.direction !== undefined) data.direction = frontendCall.direction;
    if (frontendCall.durationSeconds !== undefined) data.duration = frontendCall.durationSeconds;
    if (frontendCall.cost !== undefined) data.cost = frontendCall.cost;
    if (frontendCall.status !== undefined) data.status = frontendCall.status;
    if (frontendCall.sentiment !== undefined) data.sentiment = frontendCall.sentiment;
    if (frontendCall.recordingUrl !== undefined) data.recording_url = frontendCall.recordingUrl;
    if (frontendCall.transcript !== undefined) data.transcript = JSON.stringify(frontendCall.transcript);
    return data;
  }

  async getAll(): Promise<CallLog[]> {
    const response = await fetchAPI('/api/calls?page_size=100');
    return response.items.map((item: any) => this.mapToFrontend(item));
  }

  async getById(id: string): Promise<CallLog | null> {
    try {
      const response = await fetchAPI(`/api/calls/${id}`);
      return this.mapToFrontend(response);
    } catch {
      return null;
    }
  }

  async create(newItem: Omit<CallLog, 'id'> & Partial<{ id: string }>): Promise<CallLog> {
    const payload = this.mapToBackend(newItem);
    if (!payload.phone_number) payload.phone_number = '+10000000000';
    const response = await fetchAPI('/api/calls', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return this.mapToFrontend(response);
  }

  async update(id: string, updates: Partial<CallLog>): Promise<CallLog> {
    const payload = this.mapToBackend(updates);
    const response = await fetchAPI(`/api/calls/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return this.mapToFrontend(response);
  }

  async delete(id: string): Promise<void> {
    await fetchAPI(`/api/calls/${id}`, { method: 'DELETE' });
  }

  async deleteBulk(ids: string[]): Promise<void> {
    await Promise.all(ids.map(id => this.delete(id).catch(e => console.error(e))));
  }
}

export const callHistoryRepository = new ApiCallHistoryRepository();

class ApiCampaignRepository {
  private mapToFrontend(backendCamp: any): Campaign {
    return {
      id: backendCamp.id,
      name: backendCamp.name,
      type: (backendCamp.type?.toLowerCase() || 'outbound') as any,
      status: (backendCamp.status?.toLowerCase() || 'running') as any,
      agentName: 'Configured Agent', // Backend stores agent_id
      totalLeads: backendCamp.total_leads || 0,
      completedCalls: backendCamp.completed_calls || 0,
      convertedLeads: Math.round((backendCamp.total_leads || 0) * (backendCamp.success_rate || 0) / 100) || 0,
      startDate: backendCamp.created_at || new Date().toISOString(),
      scheduleWindow: backendCamp.schedule_type || 'Immediate Execution',
    };
  }

  private mapToBackend(frontendCamp: Partial<Campaign>): any {
    const data: any = {};
    if (frontendCamp.name !== undefined) data.name = frontendCamp.name;
    if (frontendCamp.type !== undefined) data.type = frontendCamp.type;
    if (frontendCamp.status !== undefined) data.status = frontendCamp.status;
    if (frontendCamp.totalLeads !== undefined) data.total_leads = frontendCamp.totalLeads;
    if (frontendCamp.completedCalls !== undefined) data.completed_calls = frontendCamp.completedCalls;
    if (frontendCamp.scheduleWindow !== undefined) data.schedule_type = frontendCamp.scheduleWindow;
    return data;
  }

  async getAll(): Promise<Campaign[]> {
    const response = await fetchAPI('/api/campaigns?page_size=100');
    return response.items.map((item: any) => this.mapToFrontend(item));
  }

  async getById(id: string): Promise<Campaign | null> {
    try {
      const response = await fetchAPI(`/api/campaigns/${id}`);
      return this.mapToFrontend(response);
    } catch {
      return null;
    }
  }

  async create(newItem: Omit<Campaign, 'id'> & Partial<{ id: string }>): Promise<Campaign> {
    const payload = this.mapToBackend(newItem);
    if (!payload.name) payload.name = 'New Campaign';
    const response = await fetchAPI('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return this.mapToFrontend(response);
  }

  async update(id: string, updates: Partial<Campaign>): Promise<Campaign> {
    const payload = this.mapToBackend(updates);
    const response = await fetchAPI(`/api/campaigns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return this.mapToFrontend(response);
  }

  async delete(id: string): Promise<void> {
    await fetchAPI(`/api/campaigns/${id}`, { method: 'DELETE' });
  }

  async deleteBulk(ids: string[]): Promise<void> {
    await Promise.all(ids.map(id => this.delete(id).catch(e => console.error(e))));
  }
}

export const campaignRepository = new ApiCampaignRepository();
class ApiContactRepository {
  private mapToFrontend(backendContact: any): Contact {
    const customVars = { ...(backendContact.custom_variables || {}) };
    const rawScore = customVars.lead_score !== undefined
      ? customVars.lead_score
      : (customVars.leadScore !== undefined
        ? customVars.leadScore
        : 50);
    const leadScore = typeof rawScore === 'number' ? rawScore : (parseInt(String(rawScore), 10) || 50);
    const company = customVars.company || '';
    const lastCalled = customVars.lastCalled || customVars.last_called || undefined;

    // Ensure tags is present in custom_variables for dynamic variable resolution
    if (!customVars.tags && !customVars.tag && backendContact.tags) {
      if (Array.isArray(backendContact.tags) && backendContact.tags.length > 0) {
        customVars.tags = backendContact.tags.join('; ');
      } else if (typeof backendContact.tags === 'string' && backendContact.tags.trim()) {
        customVars.tags = backendContact.tags;
      }
    }

    const tagsArray = Array.isArray(backendContact.tags) && backendContact.tags.length > 0
      ? backendContact.tags
      : (customVars.tags || customVars.tag ? String(customVars.tags || customVars.tag).split(/[;,]/).map((t: string) => t.trim()).filter(Boolean) : []);

    return {
      id: backendContact.id,
      name: backendContact.name,
      email: backendContact.email || '',
      phone: backendContact.phone || '',
      company: company,
      leadScore: leadScore,
      status: (backendContact.status?.toLowerCase() || 'new') as any,
      tags: tagsArray,
      lastCalled: lastCalled,
      custom_variables: customVars,
    };
  }

  private mapToBackend(frontendContact: Partial<Contact>): any {
    const data: any = { custom_variables: { ...(frontendContact.custom_variables || {}) } };
    if (frontendContact.name !== undefined) data.name = frontendContact.name;
    if (frontendContact.email !== undefined) data.email = frontendContact.email;
    if (frontendContact.phone !== undefined) data.phone = frontendContact.phone;
    if (frontendContact.status !== undefined) data.status = frontendContact.status;
    
    // Sync tags bidirectionally
    const tagsVal = data.custom_variables.tags || data.custom_variables.tag;
    if (tagsVal) {
      data.tags = String(tagsVal).split(/[;,]/).map((t: string) => t.trim()).filter(Boolean);
    } else if (frontendContact.tags !== undefined) {
      data.tags = frontendContact.tags;
      if (Array.isArray(frontendContact.tags) && frontendContact.tags.length > 0) {
        data.custom_variables.tags = frontendContact.tags.join('; ');
      }
    }
    
    if (frontendContact.company !== undefined) {
      data.company = frontendContact.company;
      data.custom_variables.company = frontendContact.company;
    }
    if (frontendContact.leadScore !== undefined) {
      data.lead_score = Number(frontendContact.leadScore) || 50;
      data.custom_variables.lead_score = Number(frontendContact.leadScore) || 50;
    }
    if (frontendContact.lastCalled !== undefined) {
      data.custom_variables.last_called = frontendContact.lastCalled;
    }
    return data;
  }

  async getAll(): Promise<Contact[]> {
    const response = await fetchAPI('/api/contacts?page_size=100');
    return response.items.map((item: any) => this.mapToFrontend(item));
  }

  async getById(id: string): Promise<Contact | null> {
    try {
      const response = await fetchAPI(`/api/contacts/${id}`);
      return this.mapToFrontend(response);
    } catch {
      return null;
    }
  }

  async create(newItem: Omit<Contact, 'id'> & Partial<{ id: string }>): Promise<Contact> {
    const payload = this.mapToBackend(newItem);
    if (!payload.name) payload.name = 'New Contact';
    if (!payload.phone) payload.phone = '+10000000000';
    const response = await fetchAPI('/api/contacts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return this.mapToFrontend(response);
  }

  async update(id: string, updates: Partial<Contact>): Promise<Contact> {
    const payload = this.mapToBackend(updates);
    const response = await fetchAPI(`/api/contacts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return this.mapToFrontend(response);
  }

  async delete(id: string): Promise<void> {
    await fetchAPI(`/api/contacts/${id}`, { method: 'DELETE' });
  }

  async deleteBulk(ids: string[]): Promise<void> {
    await fetchAPI('/api/contacts/bulk/delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }

  async clearAll(): Promise<{ success: boolean; deleted_count: number }> {
    return await fetchAPI('/api/contacts/clear-all/all', {
      method: 'POST',
    });
  }

  async getUploadedFiles(): Promise<any[]> {
    try {
      const res = await fetchAPI('/api/uploads?category=contacts');
      return ensureArray(res);
    } catch (e) {
      const res = await fetchAPI('/api/contacts/uploaded-files');
      return ensureArray(res);
    }
  }

  async importCSV(rows: any[]): Promise<Contact[]> {
    const created: Contact[] = [];
    for (const row of rows) {
      // Separate standard fields from custom dynamic variable columns
      const standardKeys = new Set([
        'name', 'Name', 'full_name', 'FullName',
        'phone', 'Phone', 'phone_number', 'PhoneNumber', 'mobile',
        'email', 'Email',
        'status', 'Status',
        'company', 'Company',
        'leadScore', 'lead_score', 'leadscore', 'Lead Score', 'LeadScore',
        'tags', 'Tags',
        'lastCalled', 'last_called', 'lastcalled',
        'id', 'ID'
      ]);
      const customVars: Record<string, any> = row.custom_variables ? { ...row.custom_variables } : {};
      
      Object.keys(row).forEach(key => {
        if (key !== 'id' && key !== 'ID' && row[key] !== undefined && row[key] !== '') {
          customVars[key] = row[key];
        }
      });

      const rawScore = row.leadScore ?? row.lead_score ?? row.leadscore ?? row['Lead Score'] ?? row.LeadScore;
      const parsedLeadScore = rawScore !== undefined ? (parseInt(String(rawScore), 10) || 50) : 50;

      const contactToCreate: any = {
        name: row.name || row.Name || row.full_name || row.FullName || 'Unnamed Contact',
        phone: row.phone || row.Phone || row.phone_number || row.PhoneNumber || row.mobile || '+10000000000',
        email: row.email || row.Email || '',
        company: row.company || row.Company || '',
        leadScore: parsedLeadScore,
        status: (row.status || row.Status || 'new').toLowerCase(),
        tags: Array.isArray(row.tags) ? row.tags : (row.tags ? [row.tags] : []),
        custom_variables: customVars
      };

      created.push(await this.create(contactToCreate));
    }
    return created;
  }

  async importCSVFile(file: File): Promise<{ success: boolean; imported_count: number; file: any; message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return await fetchAPI('/api/contacts/import-csv', {
      method: 'POST',
      body: formData,
    });
  }

  async syncFile(filename: string): Promise<{ success: boolean; imported_count: number; message: string }> {
    return await fetchAPI(`/api/contacts/sync-file/${encodeURIComponent(filename)}`, {
      method: 'POST',
    });
  }

  async unimportFile(filename: string): Promise<{ success: boolean; removed_count: number; filename: string; message: string }> {
    return await fetchAPI(`/api/contacts/unimport-file/${encodeURIComponent(filename)}`, {
      method: 'POST',
    });
  }
}

export const contactRepository = new ApiContactRepository();

class ApiPhoneNumberRepository {
  private mapToFrontend(backendPhone: any): PhoneNumber {
    return {
      id: backendPhone.id,
      number: backendPhone.number,
      country: backendPhone.country_code || 'US',
      type: 'Local', // mock type since backend uses 'provider'
      assignedAgent: backendPhone.assigned_agent_id || undefined,
      status: (backendPhone.status?.toLowerCase() || 'unassigned') as any,
      monthlyFee: backendPhone.monthly_cost || 0,
    };
  }

  private mapToBackend(frontendPhone: Partial<PhoneNumber>): any {
    const data: any = {};
    if (frontendPhone.number !== undefined) data.number = frontendPhone.number;
    if (frontendPhone.country !== undefined) data.country_code = frontendPhone.country;
    if (frontendPhone.assignedAgent !== undefined) data.assigned_agent_id = frontendPhone.assignedAgent;
    if (frontendPhone.status !== undefined) data.status = frontendPhone.status;
    if (frontendPhone.monthlyFee !== undefined) data.monthly_cost = frontendPhone.monthlyFee;
    return data;
  }

  async getAll(): Promise<PhoneNumber[]> {
    const response = await fetchAPI('/api/phone-numbers?page_size=100');
    return response.items.map((item: any) => this.mapToFrontend(item));
  }

  async getById(id: string): Promise<PhoneNumber | null> {
    try {
      const response = await fetchAPI(`/api/phone-numbers/${id}`);
      return this.mapToFrontend(response);
    } catch {
      return null;
    }
  }

  async buy(newNumberData: Omit<PhoneNumber, 'id'>): Promise<PhoneNumber> {
    const payload = this.mapToBackend(newNumberData);
    if (!payload.number) payload.number = '+10000000000';
    const response = await fetchAPI('/api/phone-numbers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return this.mapToFrontend(response);
  }

  async update(id: string, updates: Partial<PhoneNumber>): Promise<PhoneNumber> {
    const payload = this.mapToBackend(updates);
    const response = await fetchAPI(`/api/phone-numbers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return this.mapToFrontend(response);
  }

  async release(id: string): Promise<void> {
    await fetchAPI(`/api/phone-numbers/${id}`, { method: 'DELETE' });
  }

  async releaseBulk(ids: string[]): Promise<void> {
    await Promise.all(ids.map(id => this.release(id).catch(e => console.error(e))));
  }

  // To keep interface compatibility, but we just alias to buy/release
  async create(newItem: Omit<PhoneNumber, 'id'> & Partial<{ id: string }>): Promise<PhoneNumber> {
    return this.buy(newItem);
  }
  
  async delete(id: string): Promise<void> {
    return this.release(id);
  }
}

export const phoneNumberRepository = new ApiPhoneNumberRepository();

class ApiKnowledgeRepository {
  private mapToFrontend(backendDoc: any): KnowledgeDocument {
    return {
      id: backendDoc.id,
      title: backendDoc.title,
      type: backendDoc.file_type || 'PDF',
      size: backendDoc.file_size || '0 KB',
      chunks: backendDoc.chunk_count || 0,
      status: (backendDoc.status?.toLowerCase() || 'processing') as any,
      lastSynced: backendDoc.created_at || new Date().toISOString(),
    };
  }

  private mapToBackend(frontendDoc: Partial<KnowledgeDocument>): any {
    const data: any = {};
    if (frontendDoc.title !== undefined) data.title = frontendDoc.title;
    if (frontendDoc.type !== undefined) data.file_type = frontendDoc.type;
    if (frontendDoc.size !== undefined) data.file_size = frontendDoc.size;
    if (frontendDoc.chunks !== undefined) data.chunk_count = frontendDoc.chunks;
    if (frontendDoc.status !== undefined) data.status = frontendDoc.status;
    return data;
  }

  async getAll(): Promise<KnowledgeDocument[]> {
    const response = await fetchAPI('/api/knowledge-base?page_size=100');
    return response.items.map((item: any) => this.mapToFrontend(item));
  }

  async getById(id: string): Promise<KnowledgeDocument | null> {
    try {
      const response = await fetchAPI(`/api/knowledge-base/${id}`);
      return this.mapToFrontend(response);
    } catch {
      return null;
    }
  }

  async upload(doc: Partial<KnowledgeDocument>): Promise<KnowledgeDocument> {
    const payload = this.mapToBackend(doc);
    if (!payload.title) payload.title = 'New Document';
    const response = await fetchAPI('/api/knowledge-base', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return this.mapToFrontend(response);
  }

  async uploadFile(file: File): Promise<KnowledgeDocument> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetchAPI('/api/knowledge-base/file', {
      method: 'POST',
      body: formData,
    });
    return this.mapToFrontend(response);
  }

  async update(id: string, updates: Partial<KnowledgeDocument>): Promise<KnowledgeDocument> {
    const payload = this.mapToBackend(updates);
    const response = await fetchAPI(`/api/knowledge-base/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return this.mapToFrontend(response);
  }

  async delete(id: string): Promise<void> {
    await fetchAPI(`/api/knowledge-base/${id}`, { method: 'DELETE' });
  }

  // Fallbacks for BaseRepository abstract methods
  async create(newItem: Omit<KnowledgeDocument, 'id'> & Partial<{ id: string }>): Promise<KnowledgeDocument> {
    return this.upload(newItem);
  }

  async getDocumentStatus(documentId: string): Promise<any> {
    try {
      return await fetchAPI(`/api/knowledge-base/documents/${documentId}/status`);
    } catch {
      return null;
    }
  }

  async sync(id: string): Promise<KnowledgeDocument> {
    const doc = await this.getById(id);
    if (!doc) throw new Error('Not found');
    return this.update(id, { ...doc, status: 'indexed', lastSynced: new Date().toISOString() });
  }
}

export const knowledgeRepository = new ApiKnowledgeRepository();

class ApiWorkflowRepository {
  private mapToFrontend(backendWf: any): Workflow {
    return {
      id: backendWf.id,
      name: backendWf.name,
      trigger: backendWf.trigger_type || 'Unknown Trigger',
      action: backendWf.description || 'Unknown Action', // Using description for action
      status: (backendWf.status?.toLowerCase() === 'active' || backendWf.status?.toLowerCase() === 'enabled') ? 'enabled' : 'disabled',
      lastRun: backendWf.updated_at || new Date().toISOString(),
      executionsCount: 0, // Mock metric
    };
  }

  private mapToBackend(frontendWf: Partial<Workflow>): any {
    const data: any = {};
    if (frontendWf.name !== undefined) data.name = frontendWf.name;
    if (frontendWf.trigger !== undefined) data.trigger_type = frontendWf.trigger;
    if (frontendWf.action !== undefined) data.description = frontendWf.action;
    if (frontendWf.status !== undefined) data.status = frontendWf.status === 'enabled' ? 'Active' : 'Inactive';
    return data;
  }

  async getAll(): Promise<Workflow[]> {
    const response = await fetchAPI('/api/workflows?page_size=100');
    return response.items.map((item: any) => this.mapToFrontend(item));
  }

  async getById(id: string): Promise<Workflow | null> {
    try {
      const response = await fetchAPI(`/api/workflows/${id}`);
      return this.mapToFrontend(response);
    } catch {
      return null;
    }
  }

  async create(newItem: Omit<Workflow, 'id'> & Partial<{ id: string }>): Promise<Workflow> {
    const payload = this.mapToBackend(newItem);
    if (!payload.name) payload.name = 'New Workflow';
    const response = await fetchAPI('/api/workflows', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return this.mapToFrontend(response);
  }

  async update(id: string, updates: Partial<Workflow>): Promise<Workflow> {
    const payload = this.mapToBackend(updates);
    const response = await fetchAPI(`/api/workflows/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return this.mapToFrontend(response);
  }

  async delete(id: string): Promise<void> {
    await fetchAPI(`/api/workflows/${id}`, { method: 'DELETE' });
  }

  async deleteBulk(ids: string[]): Promise<void> {
    await Promise.all(ids.map(id => this.delete(id).catch(e => console.error(e))));
  }

  async toggle(id: string): Promise<Workflow> {
    const wf = await this.getById(id);
    if (!wf) throw new Error('Not found');
    const newStatus = wf.status === 'enabled' ? 'disabled' : 'enabled';
    return this.update(id, { status: newStatus });
  }
}

export const workflowRepository = new ApiWorkflowRepository();

class ApiIntegrationRepository {
  private mapToFrontend(item: any): Integration {
    const conf = item.config_json || {};
    return {
      id: item.id,
      name: item.name,
      category: item.provider,
      icon: conf.icon || 'Blocks',
      description: conf.description || '',
      connected: item.status === 'Connected',
      statusText: item.status === 'Connected' ? 'Connected & Healthy' : 'Disconnected',
    };
  }

  async getAll(): Promise<Integration[]> {
    const data = await fetchAPI('/api/integrations');
    return data.map((item: any) => this.mapToFrontend(item));
  }

  async create(data: Partial<Integration>): Promise<Integration> {
    const created = await fetchAPI('/api/integrations', {
      method: 'POST',
      body: JSON.stringify({
        provider: data.category || 'Custom',
        name: data.name || 'New Integration',
        status: data.connected ? 'Connected' : 'Disconnected',
        config_json: {
          icon: data.icon,
          description: data.description,
        }
      })
    });
    return this.mapToFrontend(created);
  }

  async update(id: string, data: Partial<Integration>): Promise<Integration> {
    const updates: any = { config_json: {} };
    if (data.name) updates.name = data.name;
    if (data.category) updates.provider = data.category;
    if (data.connected !== undefined) updates.status = data.connected ? 'Connected' : 'Disconnected';
    if (data.icon) updates.config_json.icon = data.icon;
    if (data.description) updates.config_json.description = data.description;

    const updated = await fetchAPI(`/api/integrations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
    return this.mapToFrontend(updated);
  }

  async delete(id: string): Promise<void> {
    await fetchAPI(`/api/integrations/${id}`, { method: 'DELETE' });
  }
}
export const integrationRepository = new ApiIntegrationRepository();

// -------------------------------------------------------------
// Profile Repository with localStorage persistence
// -------------------------------------------------------------
import { UserProfile, Coupon, ApiKeyItem, PaymentMethodItem, SubscriptionPlan } from '../types';

const INITIAL_PROFILE: UserProfile = {
  fullName: 'Alex Vance',
  email: 'alex.vance@nexus.ai',
  phone: '+1 (555) 019-2834',
  company: 'Nexus Artificial Intelligence Inc.',
  role: 'Super Administrator',
  timezone: 'America/Los_Angeles (PST -08:00)',
  language: 'en-US (English)',
  address: '500 Howard St, San Francisco, CA 94105, USA',
  bio: 'Lead AI Engineer and Platform Architect building voice agent operating systems.',
  avatarUrl: null,
  coverUrl: null,
  socialLinks: {
    twitter: 'https://twitter.com/alexvance_ai',
    linkedin: 'https://linkedin.com/in/alexvance-ai',
    github: 'https://github.com/alexvance',
    website: 'https://nexus.ai',
  },
  twoFactorEnabled: true,
  sessions: [
    { id: 's1', device: 'Chrome on macOS (Cloud Run Container)', location: 'San Francisco, CA', ip: '192.168.1.1', lastActive: '2 mins ago', current: true },
    { id: 's2', device: 'Safari on iPhone 15 Pro', location: 'San Jose, CA', ip: '10.0.0.42', lastActive: '1 hour ago', current: false },
    { id: 's3', device: 'Firefox on Windows 11', location: 'Austin, TX', ip: '172.16.0.12', lastActive: '3 days ago', current: false },
  ],
};

class ApiProfileRepository {
  getProfile(): UserProfile {
    return INITIAL_PROFILE;
  }

  async loadProfile(): Promise<UserProfile> {
    try {
      const response = await fetchAPI('/auth/me');
      let profileData: any = {};
      try {
        profileData = response.profile_data ? JSON.parse(response.profile_data) : {};
      } catch (e) {}

      const userEmail = response.email || 'user@nexus.ai';
      const userName = response.full_name || userEmail.split('@')[0];

      return {
        ...INITIAL_PROFILE,
        ...profileData,
        fullName: userName,
        email: userEmail,
        phone: response.phone_number || '',
        role: response.role || 'operator',
      };
    } catch (e) {
      return this.getProfile();
    }
  }

  async saveProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const current = await this.loadProfile();
    const updated = { ...current, ...updates };
    
    const payload: any = {
      full_name: updated.fullName,
      phone_number: updated.phone,
      profile_data: JSON.stringify(updated),
    };
    
    await fetchAPI('/api/users/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    
    return updated;
  }

  async uploadImage(file: File, folderCategory: string = 'profiles'): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetchAPI(`/api/uploads/${folderCategory}`, {
      method: 'POST',
      body: formData,
    });
    return res.download_url || `/api/uploads/${folderCategory}/${res.filename}`;
  }
}
export const profileRepository = new ApiProfileRepository();

// -------------------------------------------------------------
// Settings Repository
// -------------------------------------------------------------
export interface WorkspaceSettingsData {
  timezone?: string;
  language?: string;
  default_tts_engine?: string;
  default_codec?: string;
  webhook_url?: string;
  webhook_secret?: string;
  features?: any;
}

class ApiSettingsRepository {
  async getSettings(): Promise<WorkspaceSettingsData> {
    try {
      const resp = await fetchAPI('/api/settings');
      return resp;
    } catch (e) {
      console.error('Failed to get settings', e);
      return {};
    }
  }

  async updateSettings(updates: Partial<WorkspaceSettingsData>): Promise<WorkspaceSettingsData> {
    try {
      return await fetchAPI('/api/settings', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    } catch (e) {
      console.error('Failed to update settings', e);
      throw e;
    }
  }
}
export const settingsRepository = new ApiSettingsRepository();

// -------------------------------------------------------------
// Coupon Repository
// -------------------------------------------------------------
class ApiCouponRepository {
  private mapToFrontend(item: any): Coupon {
    const details = item.details_json || {};
    return {
      id: item.id,
      code: item.code,
      discountType: details.discountType || 'percentage',
      discountValue: item.discount_percent,
      minPurchase: details.minPurchase || 0,
      applicablePlans: details.applicablePlans || ['Starter', 'Pro', 'Business', 'Enterprise'],
      maxUsage: item.max_uses,
      perUserLimit: details.perUserLimit || 1,
      usageCount: item.current_uses,
      expiryDate: item.expires_at ? new Date(item.expires_at).toISOString().split('T')[0] : 'Never',
      active: details.active !== undefined ? details.active : true,
    };
  }

  async getAll(): Promise<Coupon[]> {
    const resp = ensureArray(await fetchAPI('/api/coupons'));
    return resp.map((item: any) => this.mapToFrontend(item));
  }

  async create(data: Partial<Coupon>): Promise<Coupon> {
    const created = await fetchAPI('/api/coupons', {
      method: 'POST',
      body: JSON.stringify({
        code: data.code,
        discount_percent: data.discountValue || 10,
        max_uses: data.maxUsage || 100,
        details_json: {
          discountType: data.discountType,
          minPurchase: data.minPurchase,
          applicablePlans: data.applicablePlans,
          perUserLimit: data.perUserLimit,
          active: data.active,
        }
      })
    });
    return this.mapToFrontend(created);
  }

  async update(id: string, data: Partial<Coupon>): Promise<Coupon> {
    const updated = await fetchAPI(`/api/coupons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        details_json: { active: data.active }
      })
    });
    return this.mapToFrontend(updated);
  }

  async delete(id: string): Promise<void> {
    await fetchAPI(`/api/coupons/${id}`, { method: 'DELETE' });
  }
}
export const couponRepository = new ApiCouponRepository();

// -------------------------------------------------------------
// API Key Repository
// -------------------------------------------------------------
class ApiApiKeyRepository {
  async getAll(): Promise<ApiKeyItem[]> {
    const rawKeys = await fetchAPI('/api/api-keys');
    const keys = ensureArray(rawKeys);
    return keys.map((k: any) => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.key_prefix,
      environment: k.environment || 'production',
      permissions: k.permissions || (k.scopes?.includes('write') ? 'full' : 'read-only'),
      createdDate: k.created_at ? new Date(k.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      lastUsed: k.last_used_at ? new Date(k.last_used_at).toISOString().split('T')[0] : 'Never',
      expiration: 'Never',
      status: k.status || 'active',
      usageCalls: 0,
    }));
  }

  async create(data: Partial<ApiKeyItem>): Promise<ApiKeyItem> {
    const created = await fetchAPI('/api/api-keys', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        environment: data.environment || 'production',
        permissions: data.permissions || 'full',
        expiration: data.expiration || 'Never',
        scopes: data.permissions === 'full' ? ['read', 'write'] : ['read']
      }),
    });
    return {
      id: created.id,
      name: created.name,
      keyPrefix: created.key_prefix,
      fullSecret: created.api_key,
      environment: created.environment || data.environment || 'production',
      permissions: created.permissions || data.permissions || 'full',
      createdDate: new Date(created.created_at).toISOString().split('T')[0],
      lastUsed: 'Never',
      expiration: data.expiration || 'Never',
      status: created.status || 'active',
      usageCalls: 0,
    };
  }

  async update(id: string, data: Partial<ApiKeyItem>): Promise<ApiKeyItem> {
    const updated = await fetchAPI(`/api/api-keys/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: data.name,
        status: data.status,
        environment: data.environment,
        permissions: data.permissions,
      }),
    });
    return {
      id: updated.id,
      name: updated.name,
      keyPrefix: updated.key_prefix,
      environment: updated.environment || 'production',
      permissions: updated.permissions || 'full',
      createdDate: updated.created_at ? new Date(updated.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      lastUsed: updated.last_used_at ? new Date(updated.last_used_at).toISOString().split('T')[0] : 'Never',
      expiration: 'Never',
      status: updated.status || 'active',
      usageCalls: 0,
    };
  }

  async rotate(id: string): Promise<ApiKeyItem> {
    const rotated = await fetchAPI(`/api/api-keys/${id}/rotate`, {
      method: 'POST',
    });
    return {
      id: rotated.id,
      name: rotated.name,
      keyPrefix: rotated.key_prefix,
      fullSecret: rotated.api_key,
      environment: rotated.environment || 'production',
      permissions: rotated.permissions || 'full',
      createdDate: rotated.created_at ? new Date(rotated.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      lastUsed: 'Just rotated',
      expiration: 'Never',
      status: rotated.status || 'active',
      usageCalls: 0,
    };
  }

  async delete(id: string): Promise<void> {
    await fetchAPI(`/api/api-keys/${id}`, { method: 'DELETE' });
  }
}
export const apiKeyRepository = new ApiApiKeyRepository();

// -------------------------------------------------------------
// Payment Methods Repository
// -------------------------------------------------------------
class ApiPaymentMethodRepository {
  async getAll(): Promise<PaymentMethodItem[]> {
    const res = await fetchAPI('/api/payment-methods');
    return ensureArray(res);
  }

  async create(data: Partial<PaymentMethodItem>): Promise<PaymentMethodItem> {
    return await fetchAPI('/api/payment-methods', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async update(id: string, data: Partial<PaymentMethodItem>): Promise<PaymentMethodItem> {
    // Backend doesn't support update for payment methods, so we recreate or return as is.
    return { id, ...data } as PaymentMethodItem;
  }

  async delete(id: string): Promise<void> {
    await fetchAPI(`/api/payment-methods/${id}`, { method: 'DELETE' });
  }
}
export const paymentMethodRepository = new ApiPaymentMethodRepository();

// -------------------------------------------------------------
// Plans Repository
// -------------------------------------------------------------
class ApiPlanRepository {
  async getAll(): Promise<SubscriptionPlan[]> {
    const res = await fetchAPI('/api/plans');
    return ensureArray(res);
  }

  async create(data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    throw new Error('Plans cannot be created dynamically in the UI');
  }

  async update(id: string, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    throw new Error('Plans cannot be updated dynamically in the UI');
  }

  async delete(id: string): Promise<void> {
    throw new Error('Plans cannot be deleted dynamically in the UI');
  }
}
export const planRepository = new ApiPlanRepository();

// -------------------------------------------------------------
// File Storage & Uploads Repository
// -------------------------------------------------------------
export interface UploadedFileItem {
  id: string;
  filename: string;
  category: string;
  category_name: string;
  file_type: string;
  size_bytes: number;
  size_formatted: string;
  created_at: string;
  download_url: string;
}

export interface UploadCategoryStat {
  key: string;
  name: string;
  description: string;
  icon: string;
  file_count: number;
  total_bytes: number;
  total_formatted: string;
}

export interface UploadStorageStats {
  categories: Record<string, UploadCategoryStat>;
  total_files: number;
  total_bytes: number;
  total_formatted: string;
}

export interface TrashItem {
  trash_id: string;
  filename: string;
  stored_filename: string;
  category: string;
  category_name: string;
  file_type: string;
  size_bytes: number;
  size_formatted: string;
  deleted_at: string;
  deleted_by: string;
  original_path: string;
}

export interface TrashStats {
  total_items: number;
  total_bytes: number;
  total_formatted: string;
  oldest_item: string | null;
  newest_item: string | null;
}

class ApiUploadRepository {
  async getCategories(): Promise<UploadStorageStats> {
    return await fetchAPI('/api/uploads/categories');
  }

  async getFiles(category?: string, search?: string): Promise<UploadedFileItem[]> {
    const params = new URLSearchParams();
    if (category && category !== 'ALL') params.append('category', category);
    if (search) params.append('search', search);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await fetchAPI(`/api/uploads${queryString}`);
    return ensureArray(res);
  }

  async uploadFile(category: string, file: File): Promise<UploadedFileItem> {
    const formData = new FormData();
    formData.append('file', file);
    return await fetchAPI(`/api/uploads/${category}`, {
      method: 'POST',
      body: formData,
    });
  }

  async deleteFile(category: string, filename: string, permanent: boolean = false): Promise<void> {
    const param = permanent ? '?permanent=true' : '';
    await fetchAPI(`/api/uploads/${category}/${filename}${param}`, {
      method: 'DELETE',
    });
  }

  async moveToTrash(category: string, filename: string): Promise<any> {
    return await fetchAPI(`/api/uploads/trash/${category}/${filename}`, { method: 'POST' });
  }

  async getTrashItems(category?: string, search?: string): Promise<TrashItem[]> {
    const params = new URLSearchParams();
    if (category && category !== 'ALL') params.append('category', category);
    if (search) params.append('search', search);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await fetchAPI(`/api/uploads/trash${queryString}`);
    return ensureArray(res);
  }

  async getTrashStats(): Promise<TrashStats> {
    return await fetchAPI('/api/uploads/trash/stats');
  }

  async restoreTrashItem(trashId: string): Promise<{ success: boolean; message: string }> {
    return await fetchAPI(`/api/uploads/trash/${trashId}/restore`, { method: 'POST' });
  }

  async permanentlyDeleteTrashItem(trashId: string): Promise<{ success: boolean; message: string }> {
    return await fetchAPI(`/api/uploads/trash/${trashId}`, { method: 'DELETE' });
  }

  async emptyTrash(): Promise<{ success: boolean; purged_count: number; message: string }> {
    return await fetchAPI('/api/uploads/trash', { method: 'DELETE' });
  }
}

export const uploadRepository = new ApiUploadRepository();


