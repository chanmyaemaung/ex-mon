import { convertToDate, getCurrentDate } from '@common/helpers';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { SeedCurrencyDto } from '../dtos';
import { CurrencyPrice } from '../entities/currency-price.entity';
import { CurrencyTransaction } from '../entities/currency-transaction.entity';
import { Currency } from '../entities/currency.entity';
import { CurrencyBuySell, CurrencyPriceSign } from '../enums';

@Injectable()
export class CurrencySeedService {
  constructor(
    @InjectRepository(Currency)
    private readonly currencyRepository: Repository<Currency>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

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
        throw new Error(
          'Please configure CURRENCY_API_TOKEN in your .env file',
        );
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // Fetch data from ref API
      const response = await firstValueFrom(
        this.httpService.get<SeedCurrencyDto[]>(refApiUrl, { headers }),
      ).catch((error) => {
        if (error.response?.status === 401) {
          throw new Error(
            'Invalid API token. Please check your CURRENCY_API_TOKEN',
          );
        }
        if (error.response?.status === 404) {
          throw new Error(
            'API endpoint not found. Please check your CURRENCY_API_URL',
          );
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
            price.type =
              index === 0 ? CurrencyBuySell.BUY : CurrencyBuySell.SELL;
            price.currency = currency;
            return price;
          });

          await queryRunner.manager.save(prices);
          processedCount++;
        } catch (error) {
          logger.warn(
            `Failed to process currency ${currencyData.code}: ${error.message}`,
          );
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
          throw new Error(
            'Please configure CURRENCY_API_TOKEN in your .env file',
          );
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        // Fetch transactions for each currency (last 10 days)
        const response = await firstValueFrom(
          this.httpService.get(refApiUrl, {
            headers,
            params: {
              date: getCurrentDate(),
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
            currencyTransaction.date = convertToDate(dateGroup.date);
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
}
