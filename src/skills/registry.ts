import { AgentSkill, SkillCategory } from './types';
import { fetchAPI } from '../lib/api';

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
    console.warn('[SkillsRegistry] Failed to fetch dynamic skills from backend SSOT:', e);
  }
  return [];
};

