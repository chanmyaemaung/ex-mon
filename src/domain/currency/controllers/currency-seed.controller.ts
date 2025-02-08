import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { JobProgressDto } from '@common/modules/queue/dtos/job-progress.dto';
import { CurrencyQueueService } from '../queues/currency.queue';
import { CurrencySeedService } from '../services/currency-seed.service';

@Controller('v1/currency')
export class CurrencySeedController {
  constructor(
    private readonly currencyQueue: CurrencyQueueService,
    private readonly currencySeedService: CurrencySeedService,
  ) {}

  @Post('seed')
  async seedData(): Promise<{ jobId: string }> {
    return this.currencyQueue.seedLatest();
  }

  @Post('seed-transactions')
  async seedTransactions(): Promise<{ jobId: string }> {
    return this.currencyQueue.seedTransactions();
  }

  @Post('seed-historical/:currencyId')
  async seedHistoricalTransactions(
    @Param('currencyId') currencyId: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate?: string,
  ): Promise<string> {
    return this.currencySeedService.seedHistoricalTransactions(
      currencyId,
      startDate,
      endDate,
    );
  }

  @Post('seed-all-historical')
  async seedAllHistoricalTransactions(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate?: string,
  ): Promise<{ jobId: string }> {
    return this.currencyQueue.seedAllHistoricalTransactions(startDate, endDate);
  }

  @Get('job/:id')
  async getJobStatus(@Param('id') jobId: string): Promise<JobProgressDto> {
    return this.currencyQueue.getJobStatus(jobId);
  }
}
