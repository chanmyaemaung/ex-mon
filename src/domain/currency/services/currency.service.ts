// currency.service.ts
import {
  convertToDate,
  formatDateString,
  getCurrentDate,
  getPreviousDate,
} from '@common/helpers';
import { Injectable, NotFoundException } from '@nestjs/common';
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

    if (currencies.length === 0) {
      throw new NotFoundException('No currencies found');
    }


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
    const date = query.date || getCurrentDate(); // Default to current date
    const which = query.which || 1; // Default to currency ID 1 (USD)
    const count = query.count || 10; // Default to 10 records

    // Convert date to "DD/MM/YYYY" format and then to Date object
    const formattedDate = formatDateString(date);
    const dateObject = convertToDate(formattedDate);

    // Fetch transactions for the currency
    const transactions = await this.transactionRepository.find({
      where: {
        currency: { id: which },
        date: LessThanOrEqual(dateObject),
      },
      order: { date: 'DESC', time: 'DESC' },
      take: count,
      relations: ['currency'],
    });

    // Group transactions by date
    const grouped = transactions.reduce<Record<string, CurrencyTransaction[]>>(
      (acc, transaction) => {
        // Convert date string to Date object if it's a string
        const transactionDate =
          typeof transaction.date === 'string'
            ? new Date(transaction.date)
            : transaction.date;

        const dateKey = formatDateString(
          transactionDate.toISOString().split('T')[0],
        );

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
        unit: item.currency.unit.replace('$', ''), // Remove $ from unit
        prices: [
          {
            value: this.formatNumberWithCommas(item.buyValue.toString()), // Add commas
            sign: item.buySign,
          },
          {
            value: this.formatNumberWithCommas(item.sellValue.toString()), // Add commas
            sign: item.sellSign,
          },
        ],
      })),
    }));

    // Calculate nextStartDate
    const nextStartDate =
      data.length > 0 ? getPreviousDate(data[data.length - 1].date) : null;

    return { nextStartDate, data };
  }

  private formatNumberWithCommas(value: string): string {
    const [whole, decimal] = value.split('.');
    return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${decimal || '00'}`;
  }
}
