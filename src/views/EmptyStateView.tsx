import React from 'react';
import { Layers, Plus, FileQuestion, Megaphone } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const EmptyStateView: React.FC<{ onNavigate?: (screen: any) => void }> = ({ onNavigate }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Empty State UI Patterns</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Handcrafted zero-data states ensuring clear guidance when lists or search results are empty.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-8 text-center space-y-3 flex flex-col items-center justify-center">
          <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
            <Megaphone className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">No Active Campaigns</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">
            You have not launched any outbound AI SDR calling campaigns yet.
          </p>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => onNavigate?.('campaigns')}
            className="cursor-pointer"
          >
            Create First Campaign
          </Button>
        </Card>

        <Card className="p-8 text-center space-y-3 flex flex-col items-center justify-center">
          <div className="h-12 w-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 flex items-center justify-center">
            <FileQuestion className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">No Knowledge Base Documents</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">
            Upload PDF product manuals or crawl website documentation to provide AI RAG context.
          </p>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => onNavigate?.('knowledge-base')}
            className="cursor-pointer"
          >
            Upload Document
          </Button>
        </Card>
      </div>
    </div>
  );
};
