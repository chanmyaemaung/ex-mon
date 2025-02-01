// currency.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import {
  GetLatestResponseDto,
  GetTransactionsRequestDto,
  GetTransactionsResponseDto,
} from '../dtos';
import { CurrencyTransaction } from '../entities/currency-transaction.entity';
import { Currency } from '../entities/currency.entity';
import { CurrencyBuySell } from '../enums';

@Injectable()
export class CurrencyService {
  constructor(
    @InjectRepository(Currency)
    private currencyRepository: Repository<Currency>,
    @InjectRepository(CurrencyTransaction)
    private transactionRepository: Repository<CurrencyTransaction>,
  ) {}

  // Get Latest Prices (API: api/v1/currency/getLatest)
  async getLatest(): Promise<GetLatestResponseDto[]> {
    const currencies = await this.currencyRepository.find({
      relations: ['currentPrices'],
    });

    return currencies.map((currency) => ({
      id: currency.id,
      code: currency.code,
      unit: currency.unit,
      prices: currency.currentPrices
        .sort((a, b) => (a.type === CurrencyBuySell.BUY ? -1 : 1)) // Buy first, Sell second
        .map((price) => ({
          value: price.value.toString(),
          sign: price.sign,
        })),
    }));
  }

  // Get Transactions (API: api/v1/currency/getTransactions)
  async getTransactions(
    query: GetTransactionsRequestDto,
  ): Promise<GetTransactionsResponseDto> {
    const date = query.date || this.getCurrentDate(); // Default to current date
    const which = query.which || 1; // Default to currency ID 1 (USD)
    const count = query.count || 10; // Default to 10 records

    // Convert date to "DD/MM/YYYY" format and then to Date object
    const formattedDate = this.formatDateString(date);
    const dateObject = this.convertToDate(formattedDate);

    // Fetch transactions for the currency
    const transactions = await this.transactionRepository.find({
      where: {
        currency: { id: which },
        date: LessThanOrEqual(dateObject),
      },
      order: { date: 'DESC' },
      take: count,
      relations: ['currency'],
    });

    // Group transactions by date
    const grouped = transactions.reduce<Record<string, CurrencyTransaction[]>>(
      (acc, transaction) => {
        const dateKey = transaction.date.toISOString().split('T')[0];
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(transaction);
        return acc;
      },
      {},
    );

    // Format response data
    const data = Object.entries(grouped).map(([date, items]) => ({
      date,
      transactions: items.map((item) => ({
        time: item.time,
        unit: item.currency.unit,
        prices: [
          { value: item.buyValue.toString(), sign: item.buySign },
          { value: item.sellValue.toString(), sign: item.sellSign },
        ],
      })),
    }));

    // Calculate nextStartDate (example logic)
    const nextStartDate =
      data.length > 0 ? this.getPreviousDate(data[data.length - 1].date) : null;

    return { nextStartDate, data };
  }

  private getCurrentDate(): string {
    // Return current date in "YYYY-MM-DD" format
    return new Date().toISOString().split('T')[0];
  }

  private formatDateString(date: string): string {
    // Convert "YYYY-MM-DD" to "DD/MM/YYYY"
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  }

  private convertToDate(dateString: string): Date {
    // Convert "DD/MM/YYYY" to Date object
    const [day, month, year] = dateString.split('/');
    return new Date(`${year}-${month}-${day}`);
  }

  private getPreviousDate(dateString: string): string | null {
    // Convert "DD/MM/YYYY" to Date object
    const [day, month, year] = dateString.split('/');
    const date = new Date(`${year}-${month}-${day}`);
    date.setDate(date.getDate() - 1);

    // Return in "YYYY-MM-DD" format
    return date.toISOString().split('T')[0];
  }
}
