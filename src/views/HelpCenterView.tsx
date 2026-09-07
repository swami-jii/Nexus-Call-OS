import React, { useState } from 'react';
import { HelpCircle, BookOpen, MessageSquare, Code, Terminal, Send } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Accordion } from '../components/ui/Accordion';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

export const HelpCenterView: React.FC = () => {
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const { addToast } = useToast();

  const faqs = [
    {
      id: 'faq1',
      title: 'How does Create Call OS achieve sub-350ms voice latency?',
      content:
        'Create Call OS utilizes an optimized WebRTC pipeline running on high-bandwidth edge containers. Speech-to-Text decoding is streamed concurrently to Gemini 1.5 Flash, which yields its first token in 82ms, driving instant neural voice synthesis.',
    },
    {
      id: 'faq2',
      title: 'Can I connect my own custom Twilio or Telnyx SIP trunk?',
      content:
        'Yes! Navigate to Phone Numbers -> Buy/Connect SIP Trunk or Integrations -> Twilio. Enter your SIP Ingress URI and IP whitelist to route carrier traffic directly.',
    },
    {
      id: 'faq3',
      title: 'How do I upload custom PDF manuals to the RAG Knowledge Base?',
      content:
        'Go to Knowledge Base, click "Add Knowledge Source", and upload your PDF or paste a website URL. Our vector embedding pipeline automatically parses and index chunks.',
    },
    {
      id: 'faq4',
      title: 'How can I connect my Python FastAPI backend?',
      content:
        'All UI components in Phase 1 expose standard REST payload state structures. In Phase 2, point process.env.VITE_API_URL to your FastAPI backend endpoint.',
    },
  ];

  const handleSendSupport = () => {
    if (!supportMessage.trim()) return;
    setIsSupportModalOpen(false);
    setSupportMessage('');
    addToast({
      type: 'success',
      title: 'Support Ticket Created',
      description: 'Our senior telephony engineering team will respond within 1 hour.',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Help Center & API Documentation</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Quickstart guides, architecture FAQs, and direct engineering support contact.
          </p>
        </div>
        <Button variant="primary" leftIcon={<MessageSquare className="h-4 w-4" />} onClick={() => setIsSupportModalOpen(true)}>
          Contact Engineering
        </Button>
      </div>

      {/* Quickstart Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hoverable>
          <CardHeader>
            <Code className="h-5 w-5 text-blue-600 mb-2" />
            <CardTitle>FastAPI REST Integration</CardTitle>
            <CardDescription>Connect Python backend endpoints</CardDescription>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <div className="p-3 bg-zinc-900 text-zinc-100 rounded-lg font-mono text-[11px]">
              POST /api/v1/calls/dispatch
            </div>
            <p className="text-zinc-500">Dispatch outbound AI SDR calls via HTTP request.</p>
          </CardContent>
        </Card>

        <Card hoverable>
          <CardHeader>
            <Terminal className="h-5 w-5 text-emerald-600 mb-2" />
            <CardTitle>WebRTC Audio Stream</CardTitle>
            <CardDescription>Low-latency browser calling SDK</CardDescription>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <div className="p-3 bg-zinc-900 text-zinc-100 rounded-lg font-mono text-[11px]">
              import &#123; CallClient &#125; from '@nexus/sdk';
            </div>
            <p className="text-zinc-500">Initialize browser microphone and speaker session.</p>
          </CardContent>
        </Card>

        <Card hoverable>
          <CardHeader>
            <BookOpen className="h-5 w-5 text-purple-600 mb-2" />
            <CardTitle>RAG Vector Context</CardTitle>
            <CardDescription>Cosine similarity document search</CardDescription>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <div className="p-3 bg-zinc-900 text-zinc-100 rounded-lg font-mono text-[11px]">
              GET /api/v1/rag/query?k=3
            </div>
            <p className="text-zinc-500">Retrieve relevant knowledge snippets in under 30ms.</p>
          </CardContent>
        </Card>
      </div>

      {/* FAQs */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Architecture Questions</CardTitle>
          <CardDescription>Technical questions regarding telephony SLA and latency</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion items={faqs} />
        </CardContent>
      </Card>

      {/* Support Ticket Modal */}
      <Modal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        title="Contact Engineering Support"
        description="Direct line to senior voice engineers and SIP architects."
        maxWidth="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsSupportModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSendSupport} leftIcon={<Send className="h-4 w-4" />}>
              Submit Ticket
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Your Contact Email" defaultValue="alex.vance@nexus.ai" />
          <Textarea
            label="Describe Technical Inquiry or SIP Issue"
            placeholder="Include error codes, call IDs, or trunk IP addresses..."
            rows={4}
            value={supportMessage}
            onChange={(e) => setSupportMessage(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};
