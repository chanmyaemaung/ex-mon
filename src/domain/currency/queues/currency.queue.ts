import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { QueueBaseService } from '@common/modules/queue/services/queue-base.service';

@Injectable()
export class CurrencyQueueService extends QueueBaseService {
  constructor(
    @InjectQueue('currency-sync') queue: Queue,
  ) {
    super(queue);
  }

  async seedLatest(): Promise<{ jobId: string }> {
    return this.addJob('seed-latest');
  }

  async seedTransactions(): Promise<{ jobId: string }> {
    return this.addJob('seed-transactions');
  }

  async seedAllHistoricalTransactions(startDate: string, endDate?: string): Promise<{ jobId: string }> {
    return this.addJob('seed-all-historical', { startDate, endDate });
  }
} 