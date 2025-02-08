export class JobProgressDto {
  jobId: string;
  status: 'completed' | 'failed' | 'processing';
  progress?: number;
  result?: string;
  error?: string;
} 