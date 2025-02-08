import { Job, Queue } from 'bull';
import { JobProgressDto } from '../dtos/job-progress.dto';

export abstract class QueueBaseService {
  constructor(protected readonly queue: Queue) {}

  protected async addJob(name: string, data: any = {}): Promise<{ jobId: string }> {
    const job = await this.queue.add(name, data);
    return { jobId: job.id.toString() };
  }

  async getJobStatus(jobId: string): Promise<JobProgressDto> {
    const job = await this.queue.getJob(jobId);
    
    if (!job) {
      return {
        jobId,
        status: 'failed',
        error: 'Job not found',
      };
    }

    const state = await job.getState();
    const progress = await job.progress();
    
    let status: 'completed' | 'failed' | 'processing' = 'processing';
    let result: string | undefined;
    let error: string | undefined;

    if (state === 'completed') {
      status = 'completed';
      result = job.returnvalue;
    } else if (state === 'failed') {
      status = 'failed';
      error = job.failedReason;
    }

    return {
      jobId,
      status,
      progress,
      result,
      error,
    };
  }
} 