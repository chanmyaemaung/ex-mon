import { CurrencySeedService } from '@domain/currency/services/currency-seed.service';
import { Controller, Post } from '@nestjs/common';

@Controller('v1/currency')
export class CurrencySeedController {
  constructor(private readonly currencyService: CurrencySeedService) {}

  @Post('seed')
  async seedData(): Promise<string> {
    return this.currencyService.seedLatestData();
  }

  @Post('seed-transactions')
  async seedTransactions() {
    return this.currencyService.seeTransactionsData();
  }
}
