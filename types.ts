
export enum ImageStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface ImageItem {
  id: string;
  file: File;
  previewUrl: string; // Blob URL for the original
  processedUrl?: string; // Base64 or Blob URL for the result
  status: ImageStatus;
  error?: string;
}

export interface EditingStyle {
  id: string;
  name: string;
  prompt: string;
}

export interface ProcessingStats {
  total: number;
  completed: number;
  failed: number;
}

// PWA Install Prompt Event Type
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}
