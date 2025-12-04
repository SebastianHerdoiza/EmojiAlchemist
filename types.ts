export interface GeneratedImage {
  id: string;
  prompt: string;
  imageUrl: string;
  status: 'pending' | 'success' | 'error';
  timestamp: number;
}

export interface GenerationRequest {
  prompts: string[];
  referenceImageBase64: string;
}

export enum AppState {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  COMPLETE = 'COMPLETE'
}