export type SkillCategory =
  | 'qualification'
  | 'scheduling'
  | 'retention'
  | 'routing'
  | 'payment'
  | 'support'
  | 'general';

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  systemPromptAddon: string;
  triggers: string[];
  iconName?: string;
  samplePhrase?: string;
  active?: boolean;
}
