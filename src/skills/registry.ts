import { AgentSkill, SkillCategory } from './types';
import { fetchAPI } from '../lib/api';

export const DEFAULT_SKILLS: AgentSkill[] = [
  {
    id: 'greeting',
    name: 'Greeting & Inbound Qualification',
    description: 'Warmly welcomes the caller, introduces the brand persona, and discovers business intent & volume.',
    category: 'qualification',
    systemPromptAddon: 'Greet caller warmly, state your identity concisely, and discover their requirements.',
    triggers: ['hello', 'hi', 'pricing'],
    iconName: 'Sparkles',
    active: true,
  },
  {
    id: 'appointment',
    name: 'Appointment & Calendar Scheduling',
    description: 'Checks real-time calendar availability slots, locks meeting times, and confirms invitations.',
    category: 'scheduling',
    systemPromptAddon: 'Assist caller in selecting an optimal appointment date and time slot.',
    triggers: ['book', 'schedule', 'appointment'],
    iconName: 'Calendar',
    active: true,
  },
];

export const fetchSkillsFromBackend = async (): Promise<AgentSkill[]> => {
  try {
    const data = await fetchAPI('/api/skills');
    if (Array.isArray(data) && data.length > 0) {
      return data.map((bSkill: any) => ({
        id: bSkill.id,
        name: bSkill.name || bSkill.id,
        description: bSkill.description || '',
        category: (bSkill.category as SkillCategory) || 'general',
        systemPromptAddon: bSkill.system_prompt_addon || '',
        triggers: bSkill.triggers || [],
        iconName: bSkill.icon || 'Sparkles',
        samplePhrase: bSkill.sample_phrase || '',
        active: true,
      }));
    }
  } catch (e) {
    console.warn('[SkillsRegistry] Fallback to default skills:', e);
  }
  return DEFAULT_SKILLS;
};
