// currency.controller.ts
import {
  GetLatestResponseDto,
  GetTransactionsRequestDto,
  GetTransactionsResponseDto,
} from '@domain/currency/dtos';
import { CurrencyService } from '@domain/currency/services/currency.service';
import { Controller, Get, Query } from '@nestjs/common';

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
}
