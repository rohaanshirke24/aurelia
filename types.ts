export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  isThinking?: boolean;
  image?: {
    data: string;
    mimeType: string;
  };
}

export interface SubTaskItem {
  text: string;
  completed: boolean;
}

export interface TaskItem {
  text: string;
  completed: boolean;
  subtasks?: SubTaskItem[];
}

export interface ObjectiveItem {
  main: string;
  keyResults: string[];
}

export interface StrategicPlan {
  period: '30 Day' | '60 Day' | '90 Day';
  focus: string;
  objectives: ObjectiveItem[];
  tasks: TaskItem[];
}

export interface PlanResponse {
  days30: StrategicPlan;
  days60: StrategicPlan;
  days90: StrategicPlan;
}

export interface ComplianceResult {
  simplified: string;
  actionItems: string[];
  riskLevel: 'Low' | 'Medium' | 'High';
}

export interface PromptHistoryItem {
    id: string;
    goal: string;
    context: string;
    result: string;
    timestamp: number;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  THINKING_PARTNER = 'THINKING_PARTNER',
  STRATEGIC_PLANNER = 'STRATEGIC_PLANNER',
  REGULATORY = 'REGULATORY',
  FUNDRAISING = 'FUNDRAISING',
  PROMPT_BUILDER = 'PROMPT_BUILDER',
  FOUNDATIONS = 'FOUNDATIONS',
}