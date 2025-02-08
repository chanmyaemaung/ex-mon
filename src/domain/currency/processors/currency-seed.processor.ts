import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { CurrencySeedService } from '@domain/currency/services/currency-seed.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Currency } from '../entities/currency.entity';

@Processor('currency-sync')
export class CurrencySeedProcessor {
  private readonly logger = new Logger(CurrencySeedProcessor.name);

  constructor(
    private readonly currencySeedService: CurrencySeedService,
    @InjectRepository(Currency)
    private readonly currencyRepository: Repository<Currency>,
  ) {}

  @Process('seed-latest')
  async handleSeedLatest(job: Job) {
    try {
      this.logger.debug('Start processing seed latest data...');
      job.progress(0);
      
      const result = await this.currencySeedService.seedLatestData();
      
      job.progress(100);
      this.logger.debug(`Seed latest completed: ${result}`);
      return result;
    } catch (error) {
      this.logger.error(`Seed latest failed: ${error.message}`);
      throw error;
    }
  }

  @Process('seed-transactions')
  async handleSeedTransactions(job: Job) {
    try {
      this.logger.debug('Start processing seed transactions...');
      job.progress(0);
      
      const result = await this.currencySeedService.seeTransactionsData();
      
      job.progress(100);
      this.logger.debug(`Seed transactions completed: ${result}`);
      return result;
    } catch (error) {
      this.logger.error(`Seed transactions failed: ${error.message}`);
      throw error;
    }
  }

  @Process('seed-all-historical')
  async handleSeedAllHistorical(job: Job<{ startDate: string; endDate?: string }>) {
    try {
      this.logger.debug('Start processing historical data for all currencies...');
      job.progress(0);

      const currencies = await this.currencyRepository.find();
      const totalCurrencies = currencies.length;
      let processedCount = 0;
      let results = [];

      for (const currency of currencies) {
        try {
          const result = await this.currencySeedService.seedHistoricalTransactions(
            currency.id,
            job.data.startDate,
            job.data.endDate,
          );
          results.push(`${currency.code}: ${result}`);
        } catch (error) {
          results.push(`${currency.code}: Failed - ${error.message}`);
          this.logger.error(`Failed to process ${currency.code}: ${error.message}`);
        }

        processedCount++;
        job.progress(Math.floor((processedCount / totalCurrencies) * 100));
      }

      const summary = results.join('\n');
      this.logger.debug(`Seed all historical completed:\n${summary}`);
      return summary;
    } catch (error) {
      this.logger.error(`Seed all historical failed: ${error.message}`);
      throw error;
    }
  }
} 