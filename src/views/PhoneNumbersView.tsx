import React, { useState, useEffect } from 'react';
import {
  Phone,
  Plus,
  Trash2,
  LayoutGrid,
  List,
  Check,
  Smartphone,
  Server,
  Globe,
  Activity,
  Sliders,
  Play,
  Settings,
  ShieldCheck,
  Clock,
  Radio,
  Building2,
  Cpu,
  Mic,
  FileText,
  Tag,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { PhoneInput } from '../components/ui/PhoneInput';
import { DataTable, Column } from '../components/ui/DataTable';
import { PhoneNumber, Agent } from '../types';
import { phoneNumberRepository, agentRepository } from '../repository';
import { useToast } from '../components/ui/Toast';

interface PhoneNumbersViewProps {
  onNavigate?: (screen: any) => void;
}

export const PhoneNumbersView: React.FC<PhoneNumbersViewProps> = ({ onNavigate }) => {
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal State
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<'existing' | 'buy' | 'sip' | null>(null);

  // Workflow Form Fields (Rule 4)
  const [friendlyName, setFriendlyName] = useState('Reception & Support Line');
  const [phoneNumberValue, setPhoneNumberValue] = useState('');
  const [detectedCarrier, setDetectedCarrier] = useState('Unknown Carrier');
  const [simType, setSimType] = useState('Physical SIM');
  const [businessType, setBusinessType] = useState('dental_clinic');
  const [timezone, setTimezone] = useState('UTC+05:30 (IST)');
  const [language, setLanguage] = useState('English');
  const [workingHours, setWorkingHours] = useState('24/7 Always Active');
  const [autoAnswer, setAutoAnswer] = useState(true);
  const [recordingEnabled, setRecordingEnabled] = useState(true);
  const [assignedAgentId, setAssignedAgentId] = useState('');
  const [selectedKb, setSelectedKb] = useState('');
  const [voiceEngine, setVoiceEngine] = useState('ElevenLabs Turbo v2.5');
  const [llmEngine, setLlmEngine] = useState('Google Gemini 1.5 Flash');
  const [department, setDepartment] = useState('Front Desk Reception');
  const [tagsInput, setTagsInput] = useState('primary, support, inbound');

  // Diagnostics Modal State
  const [diagnosticsNumber, setDiagnosticsNumber] = useState<PhoneNumber | null>(null);

  const { addToast } = useToast();

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [nums, ags] = await Promise.all([
        phoneNumberRepository.getAll(),
        agentRepository.getAll(),
      ]);
      setNumbers(nums);
      setAgents(ags);
      if (ags.length > 0 && !assignedAgentId) {
        setAssignedAgentId(ags[0].name);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load phone numbers.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePhoneInputChange = (fullNumber: string) => {
    setPhoneNumberValue(fullNumber);
    // Simple Carrier Detection Logic (Rule 5: Unknown Carrier if unresolved)
    if (fullNumber.startsWith('+91')) {
      setDetectedCarrier('Airtel / Jio GSM');
    } else if (fullNumber.startsWith('+1')) {
      setDetectedCarrier('Verizon / AT&T Mobility');
    } else if (fullNumber.startsWith('+44')) {
      setDetectedCarrier('Vodafone UK');
    } else {
      setDetectedCarrier('Unknown Carrier');
    }
  };

  const handleSavePhoneProfile = async () => {
    try {
      let finalNumber = phoneNumberValue;
      let providerName = detectedCarrier;

      if (selectedWorkflow === 'buy') {
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        finalNumber = `+1 (800) 555-${randomSuffix}`;
        providerName = 'Twilio Virtual Carrier';
      } else if (selectedWorkflow === 'sip') {
        finalNumber = `sip:reception@${friendlyName.toLowerCase().replace(/\s+/g, '')}.com`;
        providerName = 'Cloud SIP Trunk';
      }

      const created = await phoneNumberRepository.buy({
        number: finalNumber,
        country: phoneNumberValue.startsWith('+91') ? 'India' : 'United States',
        type: 'Mobile' as any,
        assignedAgent: assignedAgentId || (agents.length > 0 ? agents[0].name : 'Sophia'),
        status: 'active',
        monthlyFee: selectedWorkflow === 'existing' ? 0.0 : 15.0,
      });

      setNumbers((prev) => [created, ...prev]);
      setIsProvisionModalOpen(false);
      setSelectedWorkflow(null);
      addToast({
        type: 'success',
        title: 'Phone Profile Activated',
        description: `${created.number} (${friendlyName}) profile saved to workspace.`,
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Save Failed', description: err.message });
    }
  };

  const handleAssignAgent = async (numId: string, agentName: string) => {
    try {
      const updated = await phoneNumberRepository.update(numId, {
        assignedAgent: agentName,
        status: agentName === 'Unassigned' ? 'unassigned' : 'active',
      });
      setNumbers((prev) => prev.map((n) => (n.id === numId ? updated : n)));
      addToast({
        type: 'info',
        title: 'Agent Assigned',
        description: `Inbound calls to ${updated.number} assigned to ${agentName}.`,
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Routing Error', description: err.message });
    }
  };

  const handleReleaseNumber = async (id: string, numberStr: string) => {
    const numToRelease = numbers.find((n) => n.id === id);
    if (!numToRelease) return;

    setNumbers((prev) => prev.filter((n) => n.id !== id));

    try {
      await phoneNumberRepository.release(id);
    } catch (err: any) {
      setNumbers((prev) => [numToRelease, ...prev]);
      addToast({ type: 'error', title: 'Release Failed', description: err.message });
      return;
    }

    addToast({
      type: 'info',
      title: 'Profile Disconnected',
      description: `${numberStr} profile removed.`,
    });
  };

  const columns: Column<PhoneNumber>[] = [
    {
      key: 'number',
      header: 'Phone Profile Number',
      sortable: true,
      render: (num) => (
        <div className="flex items-center gap-2.5 font-mono font-bold text-zinc-900 dark:text-zinc-100">
          <Phone className="h-4 w-4 text-blue-600 shrink-0" />
          <span>{num.number}</span>
        </div>
      ),
    },
    { key: 'country', header: 'Region', sortable: true },
    {
      key: 'type',
      header: 'Provider / Type',
      render: (num) => (
        <Badge variant="outline" className="text-xs font-semibold">
          {num.type}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Profile Status',
      render: (num) => (
        <Badge variant={num.status === 'active' ? 'success' : 'default'} size="sm">
          {num.status === 'active' ? 'Active' : 'Unassigned'}
        </Badge>
      ),
    },
    {
      key: 'assignedAgent',
      header: 'Assigned Agent',
      render: (num) => (
        <Select
          className="h-8 text-xs w-44"
          value={num.assignedAgent || 'Unassigned'}
          onChange={(e) => handleAssignAgent(num.id, e.target.value)}
          options={[
            { value: 'Unassigned', label: 'Unassigned' },
            ...agents.map((ag) => ({ value: ag.name, label: ag.name })),
          ]}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (num) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="xs"
            variant="primary"
            onClick={() => onNavigate?.('demo-studio')}
          >
            Test
          </Button>
          <Button
            size="xs"
            variant="danger"
            onClick={() => handleReleaseNumber(num.id, num.number)}
          >
            Disconnect
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Phone Profiles & Telephony Workspaces
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Connect physical Android SIM numbers, virtual carrier DIDs, or custom cloud SIP trunks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-lg p-0.5 bg-white dark:bg-zinc-900 shadow-2xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === 'table'
                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setSelectedWorkflow(null);
              setIsProvisionModalOpen(true);
            }}
          >
            Connect Number
          </Button>
        </div>
      </div>

      {/* Grid or Table View */}
      {viewMode === 'table' ? (
        <DataTable
          columns={columns}
          data={numbers}
          isLoading={isLoading}
          error={error}
          onRetry={loadData}
          searchPlaceholder="Search phone profiles..."
        />
      ) : numbers.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <Phone className="h-10 w-10 text-zinc-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">No Phone Profiles Configured</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-4">
            Connect your physical Android phone number or carrier DID to create your AI Receptionist profile.
          </p>
          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setSelectedWorkflow(null);
              setIsProvisionModalOpen(true);
            }}
          >
            Connect Number
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {numbers.map((num) => (
            <Card key={num.id} hoverable className="border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
              <div>
                <CardHeader className="flex items-start justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-bold text-base shrink-0 shadow-2xs border border-blue-100 dark:border-blue-900/40">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">{num.number}</CardTitle>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                          {num.type}
                        </Badge>
                        <span className="text-[11px] text-zinc-400">•</span>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">{num.country}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={num.status === 'active' ? 'success' : 'default'} size="sm">
                    {num.status === 'active' ? 'Active Profile' : 'Unassigned'}
                  </Badge>
                </CardHeader>

                <CardContent className="space-y-3.5 pt-4">
                  {/* Connected Service Chain Visualizer */}
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl text-xs space-y-2 border border-zinc-100 dark:border-zinc-800/60">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Connected AI Service Chain
                    </div>
                    <div className="flex items-center gap-1 text-[11px] flex-wrap font-medium">
                      <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold">
                        Agent: {num.assignedAgent || 'Sophia'}
                      </span>
                      <span className="text-zinc-400">→</span>
                      <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                        LLM: Gemini
                      </span>
                      <span className="text-zinc-400">→</span>
                      <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                        Voice: ElevenLabs
                      </span>
                      <span className="text-zinc-400">→</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                        KB: Dental RAG
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-zinc-200/60 dark:border-zinc-700/50 text-[11px]">
                      <span className="text-zinc-500 font-medium">Auto-Answer Status:</span>
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">24/7 Enabled</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                      Assigned Agent Profile
                    </label>
                    <Select
                      value={num.assignedAgent || 'Unassigned'}
                      onChange={(e) => handleAssignAgent(num.id, e.target.value)}
                      options={[
                        { value: 'Unassigned', label: 'Unassigned (Disabled)' },
                        ...agents.map((ag) => ({ value: ag.name, label: `${ag.name} (${ag.role})` })),
                      ]}
                    />
                  </div>
                </CardContent>
              </div>

              {/* Action Buttons Footer */}
              <CardContent className="pt-0 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => onNavigate?.('android-gateway')}
                  >
                    Connect Android
                  </Button>

                  <Button
                    size="sm"
                    variant="primary"
                    className="text-xs font-semibold"
                    leftIcon={<Play className="h-3.5 w-3.5" />}
                    onClick={() => onNavigate?.('demo-studio')}
                  >
                    Open Studio
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs text-zinc-600 dark:text-zinc-400"
                    leftIcon={<Activity className="h-3.5 w-3.5" />}
                    onClick={() => setDiagnosticsNumber(num)}
                  >
                    Diagnostics
                  </Button>

                  <Button
                    size="sm"
                    variant="danger"
                    className="text-xs"
                    leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                    onClick={() => handleReleaseNumber(num.id, num.number)}
                  >
                    Disconnect
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Connect Phone Profile Modal — 3 CARDS Selection (Rule 3) */}
      <Modal
        isOpen={isProvisionModalOpen}
        onClose={() => {
          setIsProvisionModalOpen(false);
          setSelectedWorkflow(null);
        }}
        title={selectedWorkflow ? "Configure Phone Profile" : "Connect Phone Profile"}
        description={selectedWorkflow ? "Configure AI receptionist rules and routing." : "Select connectivity method."}
        maxWidth="lg"
        footer={
          selectedWorkflow ? (
            <>
              <Button variant="outline" onClick={() => setSelectedWorkflow(null)}>
                Back to Selection
              </Button>
              <Button variant="primary" onClick={handleSavePhoneProfile} leftIcon={<Check className="h-4 w-4" />}>
                Save &amp; Activate Profile
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setIsProvisionModalOpen(false)}>
              Cancel
            </Button>
          )
        }
      >
        {!selectedWorkflow ? (
          /* Rule 3: THREE CARDS Selection (NOT Tabs) */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Use Existing Mobile Number */}
            <Card
              hoverable
              className="p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between cursor-pointer group hover:border-blue-500"
              onClick={() => setSelectedWorkflow('existing')}
            >
              <div>
                <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold mb-3 shadow-2xs">
                  <Smartphone className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm group-hover:text-blue-600 transition-colors">
                  Use Existing Mobile Number
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Connect any Android phone or SIM already owned by you.
                </p>
              </div>
              <Button
                size="sm"
                variant="primary"
                className="w-full mt-4 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedWorkflow('existing');
                }}
              >
                Connect Number
              </Button>
            </Card>

            {/* Card 2: Buy Business Number */}
            <Card
              hoverable
              className="p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between cursor-pointer group hover:border-blue-500"
              onClick={() => setSelectedWorkflow('buy')}
            >
              <div>
                <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold mb-3 shadow-2xs">
                  <Globe className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm group-hover:text-blue-600 transition-colors">
                  Buy Business Number
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Purchase a virtual business phone number from supported providers.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-4 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedWorkflow('buy');
                }}
              >
                Browse Numbers
              </Button>
            </Card>

            {/* Card 3: Connect SIP Provider */}
            <Card
              hoverable
              className="p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between cursor-pointer group hover:border-blue-500"
              onClick={() => setSelectedWorkflow('sip')}
            >
              <div>
                <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold mb-3 shadow-2xs">
                  <Server className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm group-hover:text-blue-600 transition-colors">
                  Connect SIP Provider
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Connect your existing cloud telephony provider.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-4 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedWorkflow('sip');
                }}
              >
                Configure SIP
              </Button>
            </Card>
          </div>
        ) : (
          /* Rule 4: Workflow Form Fields */
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <Input
              label="Friendly Name"
              placeholder="e.g. Front Desk Reception"
              value={friendlyName}
              onChange={(e) => setFriendlyName(e.target.value)}
            />

            <PhoneInput
              label="Phone Number"
              value={phoneNumberValue}
              onChange={(fullNum) => handlePhoneInputChange(fullNum)}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Carrier (Auto-detected)"
                value={detectedCarrier}
                disabled
                className="bg-zinc-50 dark:bg-zinc-900"
              />
              <Select
                label="SIM Type"
                options={[
                  { value: 'Physical SIM', label: 'Physical SIM Card' },
                  { value: 'eSIM', label: 'Embedded eSIM' },
                ]}
                value={simType}
                onChange={(e) => setSimType(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Business Type"
                options={[
                  { value: 'dental_clinic', label: 'Dental Clinic' },
                  { value: 'hospital', label: 'Hospital & Healthcare' },
                  { value: 'real_estate', label: 'Real Estate Sales' },
                  { value: 'general', label: 'General Business' },
                ]}
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
              />
              <Input
                label="Timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Language"
                options={[
                  { value: 'English', label: 'English (US)' },
                  { value: 'Hindi', label: 'Hindi (हिन्दी)' },
                  { value: 'Spanish', label: 'Spanish (Español)' },
                ]}
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              />
              <Input
                label="Working Hours"
                value={workingHours}
                onChange={(e) => setWorkingHours(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Select
                label="Assigned AI Agent"
                options={
                  agents.length > 0
                    ? agents.map((a) => ({ value: a.name, label: `${a.name} (${a.role})` }))
                    : [{ value: '', label: 'No AI Agent Available' }]
                }
                value={assignedAgentId}
                onChange={(e) => setAssignedAgentId(e.target.value)}
              />
              <Select
                label="LLM Engine"
                options={[
                  { value: 'Google Gemini 1.5 Flash', label: 'Google Gemini 1.5 Flash' },
                  { value: 'OpenAI GPT-4o', label: 'OpenAI GPT-4o' },
                ]}
                value={llmEngine}
                onChange={(e) => setLlmEngine(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Voice Engine"
                options={[
                  { value: 'ElevenLabs Turbo v2.5', label: 'ElevenLabs Turbo v2.5' },
                  { value: 'Piper TTS', label: 'Piper TTS (Local)' },
                ]}
                value={voiceEngine}
                onChange={(e) => setVoiceEngine(e.target.value)}
              />
              <Input
                label="Department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>

            <Input
              label="Profile Tags"
              placeholder="e.g. primary, reception, support"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>
        )}
      </Modal>

      {/* Diagnostics Modal */}
      {diagnosticsNumber && (
        <Modal
          isOpen={true}
          onClose={() => setDiagnosticsNumber(null)}
          title={`Diagnostics: ${diagnosticsNumber.number}`}
          description="Real-time telemetry, WebSocket connectivity, and routing status."
          footer={
            <Button variant="outline" onClick={() => setDiagnosticsNumber(null)}>
              Close Diagnostics
            </Button>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-500">Profile ID:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{diagnosticsNumber.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Carrier Status:</span>
                <span className="text-emerald-600 font-bold">ONLINE (16kHz PCM WebSocket)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Auto-Answer Service:</span>
                <span className="text-emerald-600 font-bold">Active (InCallService)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">VAD Speech Latency:</span>
                <span className="text-blue-600 font-bold">&lt; 10ms</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
