// currency.service.ts
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { LessThanOrEqual, Repository } from 'typeorm';
import {
  GetLatestResponseDto,
  GetTransactionsRequestDto,
  GetTransactionsResponseDto,
  SeedCurrencyDto,
} from '../dtos';
import { CurrencyPrice } from '../entities/currency-price.entity';
import { CurrencyTransaction } from '../entities/currency-transaction.entity';
import { Currency } from '../entities/currency.entity';
import { CurrencyBuySell, CurrencyPriceSign } from '../enums';

@Injectable()
export class CurrencyService {
  constructor(
    @InjectRepository(Currency)
    private currencyRepository: Repository<Currency>,
    @InjectRepository(CurrencyTransaction)
    private transactionRepository: Repository<CurrencyTransaction>,
    private httpService: HttpService,
    private configService: ConfigService,
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

        const dateKey = this.formatDateString(
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
      data.length > 0 ? this.getPreviousDate(data[data.length - 1].date) : null;

    return { nextStartDate, data };
  }

  async seedLatestData(): Promise<string> {
    const logger = new Logger('CurrencyService');
    const queryRunner =
      this.currencyRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const refApiUrl =
        this.configService.get<string>('CURRENCY_API_URL') +
        'currency/getLatest';
      const token = this.configService.get<string>('CURRENCY_API_TOKEN');

      if (!token) {
        throw new Error('Please configure CURRENCY_API_TOKEN in your .env file');
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // Fetch data from ref API
      const response = await firstValueFrom(
        this.httpService.get<SeedCurrencyDto[]>(refApiUrl, { headers }),
      ).catch((error) => {
        if (error.response?.status === 401) {
          throw new Error('Invalid API token. Please check your CURRENCY_API_TOKEN');
        }
        if (error.response?.status === 404) {
          throw new Error('API endpoint not found. Please check your CURRENCY_API_URL');
        }
        logger.error(`API request failed: ${error.message}`);
        throw new Error(`Unable to fetch currency data: ${error.message}`);
      });

      // Process currencies
      const currencies = response.data;
      let processedCount = 0;
      let skippedCount = 0;

      for (const currencyData of currencies) {
        try {
          // Check if currency already exists
          const existingCurrency = await queryRunner.manager.findOne(Currency, {
            where: { code: currencyData.code },
          });

          if (existingCurrency) {
            skippedCount++;
            continue;
          }

          // Create Currency
          const currency = await queryRunner.manager.save(
            queryRunner.manager.create(Currency, {
              code: currencyData.code,
              unit: currencyData.unit,
            }),
          );

          // Create CurrencyPrices
          const prices = currencyData.prices.map((priceData, index) => {
            const price = new CurrencyPrice();
            price.value = parseFloat(priceData.value.replace(/,/g, '')); // Convert "4,460.00" to 4460.00
            price.sign = priceData.sign as CurrencyPriceSign;
            price.type = index === 0 ? CurrencyBuySell.BUY : CurrencyBuySell.SELL;
            price.currency = currency;
            return price;
          });

          await queryRunner.manager.save(prices);
          processedCount++;
        } catch (error) {
          logger.warn(`Failed to process currency ${currencyData.code}: ${error.message}`);
          continue;
        }
      }

      await queryRunner.commitTransaction();
      return `Successfully processed ${processedCount} currencies (${skippedCount} already existed)`;
    } catch (error) {
      logger.error(`Seeding failed: ${error.message}`);
      await queryRunner.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      await queryRunner.release();
    }
  }

  async seeTransactionsData(): Promise<string> {
    const logger = new Logger('CurrencyService');
    const queryRunner =
      this.currencyRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get all currencies from database
      const currencies = await this.currencyRepository.find();
      let totalTransactions = 0;

      for (const currency of currencies) {
        const refApiUrl =
          this.configService.get<string>('CURRENCY_API_URL') +
          'currency/getTransactions';
        const token = this.configService.get<string>('CURRENCY_API_TOKEN');

        if (!token) {
          throw new Error('Please configure CURRENCY_API_TOKEN in your .env file');
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        // Fetch transactions for each currency (last 10 days)
        const response = await firstValueFrom(
          this.httpService.get(refApiUrl, {
            headers,
            params: {
              date: this.getCurrentDate(),
              which: currency.id,
              count: 10,
            },
          }),
        ).catch((error) => {
          logger.error(
            `API request failed for currency ${currency.code}: ${
              error.response?.data || error.message
            }`,
          );
          throw new Error(
            `API request failed for currency ${currency.code}: ${
              error.response?.data?.message || error.message
            }`,
          );
        });

        // Process transactions for this currency
        for (const dateGroup of response.data.data) {
          for (const transaction of dateGroup.transactions) {
            const currencyTransaction = new CurrencyTransaction();
            currencyTransaction.currency = currency;
            currencyTransaction.date = this.convertToDate(dateGroup.date);
            currencyTransaction.time = transaction.time;

            // Set buy and sell values directly
            currencyTransaction.buyValue = parseFloat(
              transaction.prices[0].value.replace(/,/g, ''),
            );
            currencyTransaction.buySign = transaction.prices[0]
              .sign as CurrencyPriceSign;
            currencyTransaction.sellValue = parseFloat(
              transaction.prices[1].value.replace(/,/g, ''),
            );
            currencyTransaction.sellSign = transaction.prices[1]
              .sign as CurrencyPriceSign;

            // Save transaction
            await queryRunner.manager.save(currencyTransaction);
            totalTransactions++;
          }
        }

        // Add delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      await queryRunner.commitTransaction();
      return `Successfully seeded ${totalTransactions} transactions for ${currencies.length} currencies!`;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new Error(`Seeding transactions failed: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
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

  private formatNumberWithCommas(value: string): string {
    const [whole, decimal] = value.split('.');
    return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${decimal || '00'}`;
  }
}
