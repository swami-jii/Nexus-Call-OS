import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Play,
  Pause,
  Trash2,
  LayoutGrid,
  List,
  Check,
  Edit2,
  Copy,
  Archive,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Progress } from '../components/ui/Progress';
import { DataTable, Column } from '../components/ui/DataTable';
import { Campaign, Agent } from '../types';
import { campaignRepository, agentRepository } from '../repository';
import { useToast } from '../components/ui/Toast';

export const CampaignsView: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Wizard state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignAgent, setNewCampaignAgent] = useState('');
  const [newCampaignType, setNewCampaignType] = useState<'outbound' | 'inbound'>('outbound');
  const [totalLeadsInput, setTotalLeadsInput] = useState('500');
  const [scheduleWindow, setScheduleWindow] = useState('Mon-Fri, 9:00 AM - 5:00 PM EST');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Edit modal state
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { addToast } = useToast();

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [cmps, ags] = await Promise.all([
        campaignRepository.getAll(),
        agentRepository.getAll(),
      ]);
      setCampaigns(cmps);
      setAgents(ags);
      if (ags.length > 0 && !newCampaignAgent) {
        setNewCampaignAgent(ags[0].name);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load campaigns.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleCampaignStatus = async (id: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === 'running' ? 'paused' : 'running';
      const updated = await campaignRepository.update(id, { status: nextStatus as any });
      setCampaigns((prev) => prev.map((c) => (c.id === id ? updated : c)));
      addToast({
        type: 'info',
        title: `Campaign ${nextStatus === 'running' ? 'Resumed' : 'Paused'}`,
        description: `Status updated to ${nextStatus}.`,
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Update Failed', description: err.message });
    }
  };

  const handleDuplicateCampaign = async (campaign: Campaign) => {
    try {
      const duplicated = await campaignRepository.create({
        name: `${campaign.name} (Copy)`,
        type: campaign.type,
        status: 'paused',
        agentName: campaign.agentName,
        totalLeads: campaign.totalLeads,
        completedCalls: 0,
        convertedLeads: 0,
        startDate: new Date().toISOString().split('T')[0],
        scheduleWindow: campaign.scheduleWindow,
      });
      setCampaigns((prev) => [duplicated, ...prev]);
      addToast({
        type: 'success',
        title: 'Campaign Duplicated',
        description: `Created "${duplicated.name}".`,
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Duplicate Failed', description: err.message });
    }
  };

  const handleDeleteCampaign = async (id: string, name: string) => {
    const campaignToDelete = campaigns.find((c) => c.id === id);
    if (!campaignToDelete) return;

    setCampaigns((prev) => prev.filter((c) => c.id !== id));

    try {
      await campaignRepository.delete(id);
    } catch (err: any) {
      setCampaigns((prev) => [campaignToDelete, ...prev]);
      addToast({ type: 'error', title: 'Delete Failed', description: err.message });
      return;
    }

    addToast({
      type: 'info',
      title: 'Campaign Deleted',
      description: `Campaign "${name}" removed.`,
      action: {
        label: 'Undo',
        onClick: async () => {
          try {
            const restored = await campaignRepository.create(campaignToDelete);
            setCampaigns((prev) => [restored, ...prev]);
            addToast({
              type: 'success',
              title: 'Campaign Restored',
              description: `Restored "${name}".`,
            });
          } catch (e: any) {
            addToast({ type: 'error', title: 'Undo Failed', description: e.message });
          }
        },
      },
    });
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await campaignRepository.deleteBulk(ids);
      setCampaigns((prev) => prev.filter((c) => !ids.includes(c.id)));
      addToast({ type: 'success', title: 'Bulk Delete Complete', description: `Deleted ${ids.length} campaigns.` });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Bulk Delete Failed', description: err.message });
    }
  };

  const handleBulkStatusChange = async (ids: string[], newStatus: string) => {
    try {
      await Promise.all(ids.map((id) => campaignRepository.update(id, { status: newStatus as any })));
      setCampaigns((prev) =>
        prev.map((c) => (ids.includes(c.id) ? { ...c, status: newStatus as any } : c))
      );
      addToast({
        type: 'success',
        title: 'Status Updated',
        description: `Updated status for ${ids.length} campaigns to ${newStatus}.`,
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Bulk Update Failed', description: err.message });
    }
  };

  const handleCreateCampaign = async () => {
    if (!newCampaignName.trim()) {
      setFormErrors({ name: 'Campaign name is required' });
      return;
    }
    try {
      const created = await campaignRepository.create({
        name: newCampaignName,
        type: newCampaignType,
        status: 'running',
        agentName: newCampaignAgent || (agents[0]?.name || 'Sophia'),
        totalLeads: parseInt(totalLeadsInput) || 500,
        completedCalls: 0,
        convertedLeads: 0,
        startDate: new Date().toISOString().split('T')[0],
        scheduleWindow,
      });

      setCampaigns((prev) => [created, ...prev]);
      setIsWizardOpen(false);
      setWizardStep(1);
      setNewCampaignName('');
      setFormErrors({});
      addToast({
        type: 'success',
        title: 'Campaign Launched',
        description: `${created.name} is now actively running with ${created.agentName}.`,
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Launch Failed', description: err.message });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingCampaign) return;
    try {
      const updated = await campaignRepository.update(editingCampaign.id, editingCampaign);
      setCampaigns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setIsEditModalOpen(false);
      setEditingCampaign(null);
      addToast({
        type: 'success',
        title: 'Campaign Updated',
        description: `Saved changes to "${updated.name}".`,
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Save Failed', description: err.message });
    }
  };

  const columns: Column<Campaign>[] = [
    {
      key: 'name',
      header: 'Campaign Name',
      sortable: true,
      render: (cmp) => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
            <Megaphone className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{cmp.name}</p>
            <p className="text-xs text-zinc-500">Agent: {cmp.agentName}</p>
          </div>
        </div>
      ),
    },
    { key: 'type', header: 'Type', sortable: true },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (cmp) => (
        <Badge
          variant={
            cmp.status === 'running'
              ? 'success'
              : cmp.status === 'paused'
              ? 'warning'
              : cmp.status === 'completed'
              ? 'default'
              : 'info'
          }
          size="sm"
        >
          {cmp.status}
        </Badge>
      ),
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (cmp) => {
        const pct = cmp.totalLeads > 0 ? Math.round((cmp.completedCalls / cmp.totalLeads) * 100) : 0;
        return (
          <div className="w-32 space-y-1">
            <div className="flex justify-between text-[11px] text-zinc-500">
              <span>{pct}%</span>
              <span>
                {cmp.completedCalls}/{cmp.totalLeads}
              </span>
            </div>
            <Progress value={pct} />
          </div>
        );
      },
    },
    {
      key: 'convertedLeads',
      header: 'Conversions',
      sortable: true,
      render: (cmp) => <span className="font-semibold text-emerald-600">{cmp.convertedLeads}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (cmp) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            leftIcon={cmp.status === 'running' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            onClick={() => toggleCampaignStatus(cmp.id, cmp.status)}
          >
            {cmp.status === 'running' ? 'Pause' : 'Resume'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Edit2 className="h-3.5 w-3.5" />}
            onClick={() => {
              setEditingCampaign(cmp);
              setIsEditModalOpen(true);
            }}
          />
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Copy className="h-3.5 w-3.5" />}
            onClick={() => handleDuplicateCampaign(cmp)}
          />
          <Button
            size="sm"
            variant="danger"
            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={() => handleDeleteCampaign(cmp.id, cmp.name)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">AI Calling Campaigns</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Automated outbound SDR dialing batches and high-throughput inbound queues.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-lg p-0.5 bg-white dark:bg-zinc-900">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-600'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === 'table'
                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-600'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsWizardOpen(true)}
          >
            New Campaign Wizard
          </Button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <DataTable
          columns={columns}
          data={campaigns}
          isLoading={isLoading}
          error={error}
          onRetry={loadData}
          onBulkDelete={handleBulkDelete}
          onBulkStatusChange={handleBulkStatusChange}
          bulkStatusOptions={['running', 'paused', 'completed']}
          searchPlaceholder="Search campaigns by name, agent..."
          filterableKeys={[{ label: 'Status', key: 'status', options: ['running', 'paused', 'completed', 'scheduled'] }]}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {campaigns.map((cmp) => {
            const progressPercent =
              cmp.totalLeads > 0 ? Math.round((cmp.completedCalls / cmp.totalLeads) * 100) : 0;
            return (
              <Card key={cmp.id} hoverable>
                <CardHeader className="flex items-start justify-between pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                      <Megaphone className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>{cmp.name}</CardTitle>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Assigned Agent: <strong className="text-zinc-800 dark:text-zinc-200">{cmp.agentName}</strong>
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      cmp.status === 'running'
                        ? 'success'
                        : cmp.status === 'paused'
                        ? 'warning'
                        : 'default'
                    }
                  >
                    {cmp.status}
                  </Badge>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Campaign Progress</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {(cmp.completedCalls ?? 0).toLocaleString()} / {(cmp.totalLeads ?? 0).toLocaleString()} Leads ({progressPercent}%)
                      </span>
                    </div>
                    <Progress value={progressPercent} />
                  </div>

                  <div className="grid grid-cols-3 gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl text-center text-xs">
                    <div>
                      <p className="text-zinc-400 text-[10px]">Total Leads</p>
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">{(cmp.totalLeads ?? 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-zinc-400 text-[10px]">Calls Placed</p>
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">{(cmp.completedCalls ?? 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-zinc-400 text-[10px]">Conversions</p>
                      <p className="font-bold text-emerald-600">{(cmp.convertedLeads ?? 0).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={cmp.status === 'running' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                        onClick={() => toggleCampaignStatus(cmp.id, cmp.status)}
                      >
                        {cmp.status === 'running' ? 'Pause' : 'Resume'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<Edit2 className="h-3.5 w-3.5" />}
                        onClick={() => {
                          setEditingCampaign(cmp);
                          setIsEditModalOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<Copy className="h-3.5 w-3.5" />}
                        onClick={() => handleDuplicateCampaign(cmp)}
                      >
                        Duplicate
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="danger"
                      leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                      onClick={() => handleDeleteCampaign(cmp.id, cmp.name)}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Campaign Wizard Modal */}
      <Modal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        title="Launch AI Calling Campaign"
        description="Set up target audience, concurrency limits, and agent script."
        maxWidth="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsWizardOpen(false)}>
              Cancel
            </Button>
            {wizardStep === 1 ? (
              <Button variant="primary" onClick={() => setWizardStep(2)}>
                Next: Audience & Schedule
              </Button>
            ) : (
              <Button variant="primary" onClick={handleCreateCampaign} leftIcon={<Check className="h-4 w-4" />}>
                Launch Campaign
              </Button>
            )}
          </>
        }
      >
        {wizardStep === 1 ? (
          <div className="space-y-4">
            <Input
              label="Campaign Name"
              placeholder="e.g. Q3 Enterprise Outbound SDR Sprint"
              value={newCampaignName}
              onChange={(e) => setNewCampaignName(e.target.value)}
              error={formErrors.name}
            />

            <Select
              label="Assigned AI Agent"
              options={
                agents.length > 0
                  ? agents.map((a) => ({ value: a.name, label: `${a.name} (${a.role})` }))
                  : [{ value: '', label: 'No AI Agent Available' }]
              }
              value={newCampaignAgent}
              onChange={(e) => setNewCampaignAgent(e.target.value)}
            />

            <Select
              label="Direction Type"
              options={[
                { value: 'outbound', label: 'Outbound Predictive Dialing' },
                { value: 'inbound', label: 'Inbound Customer Routing' },
              ]}
              value={newCampaignType}
              onChange={(e) => setNewCampaignType(e.target.value as any)}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              label="Target Leads Count"
              type="number"
              value={totalLeadsInput}
              onChange={(e) => setTotalLeadsInput(e.target.value)}
            />

            <Input
              label="Dialing Window Schedule"
              value={scheduleWindow}
              onChange={(e) => setScheduleWindow(e.target.value)}
            />
          </div>
        )}
      </Modal>

      {/* Edit Campaign Modal */}
      {editingCampaign && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Campaign: ${editingCampaign.name}`}
          description="Modify target leads, assigned agent, and operating schedule."
          footer={
            <>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="Campaign Name"
              value={editingCampaign.name}
              onChange={(e) => setEditingCampaign({ ...editingCampaign, name: e.target.value })}
            />
            <Select
              label="Assigned Agent"
              options={agents.map((a) => ({ value: a.name, label: `${a.name} (${a.role})` }))}
              value={editingCampaign.agentName}
              onChange={(e) => setEditingCampaign({ ...editingCampaign, agentName: e.target.value })}
            />
            <Input
              label="Total Leads Target"
              type="number"
              value={editingCampaign.totalLeads}
              onChange={(e) =>
                setEditingCampaign({ ...editingCampaign, totalLeads: parseInt(e.target.value) || 0 })
              }
            />
            <Input
              label="Schedule Window"
              value={editingCampaign.scheduleWindow}
              onChange={(e) => setEditingCampaign({ ...editingCampaign, scheduleWindow: e.target.value })}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};
