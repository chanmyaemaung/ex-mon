// currency.controller.ts
import { Controller, Get, Post, Query } from '@nestjs/common';
import {
  GetLatestResponseDto,
  GetTransactionsRequestDto,
  GetTransactionsResponseDto,
} from '../dtos';
import { CurrencyService } from '../services/currency.service';

@Controller('v1/currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get('getLatest')
  async getLatest(): Promise<GetLatestResponseDto[]> {
    return this.currencyService.getLatest();
  }

  @Get('getTransactions')
  async getTransactions(
    @Query() query: GetTransactionsRequestDto,
  ): Promise<GetTransactionsResponseDto> {
    return this.currencyService.getTransactions(query);
  }

  @Post('seed')
  async seedData(): Promise<string> {
    return this.currencyService.seedLatestData();
  }

  @Post('seed-transactions')
  async seedTransactions() {
    return this.currencyService.seeTransactionsData();
  }
}
