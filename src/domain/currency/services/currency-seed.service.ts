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
  private readonly logger = new Logger(CurrencySeedService.name);

  constructor(
    @InjectRepository(Currency)
    private readonly currencyRepository: Repository<Currency>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Seed or update latest currency rates
   * - If currency doesn't exist, create new one
   * - If currency exists, update its prices
   * - Track price changes with signs (up/down/none)
   */
  async seedLatestData(): Promise<string> {
    const queryRunner = this.currencyRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get API configuration
      const refApiUrl = this.configService.get<string>('CURRENCY_API_URL') + 'currency/getLatest';
      const token = this.configService.get<string>('CURRENCY_API_TOKEN');

      if (!token) {
        throw new Error('Please configure CURRENCY_API_TOKEN in your .env file');
      }

      // Fetch latest data from REF API
      const response = await firstValueFrom(
        this.httpService.get<SeedCurrencyDto[]>(refApiUrl, { 
          headers: { Authorization: `Bearer ${token}` } 
        }),
      ).catch((error) => {
        if (error.response?.status === 401) {
          throw new Error('Invalid API token. Please check your CURRENCY_API_TOKEN');
        }
        if (error.response?.status === 404) {
          throw new Error('API endpoint not found. Please check your CURRENCY_API_URL');
        }
        this.logger.error(`API request failed: ${error.message}`);
        throw new Error(`Unable to fetch currency data: ${error.message}`);
      });

      const currencies = response.data;
      let updatedCount = 0;
      let createdCount = 0;

      // Process each currency
      for (const currencyData of currencies) {
        try {
          // Find or create currency
          let currency = await queryRunner.manager.findOne(Currency, {
            where: { code: currencyData.code },
          });

          if (!currency) {
            // Create new currency if not exists
            currency = await queryRunner.manager.save(
              queryRunner.manager.create(Currency, {
                code: currencyData.code,
                unit: currencyData.unit,
              }),
            );
            createdCount++;
          }

          // Update or create prices
          const prices = await queryRunner.manager.find(CurrencyPrice, {
            where: { currency: { id: currency.id } },
          });

          // Process buy and sell prices
          for (let i = 0; i < currencyData.prices.length; i++) {
            const priceData = currencyData.prices[i];
            const type = i === 0 ? CurrencyBuySell.BUY : CurrencyBuySell.SELL;
            
            let price = prices.find(p => p.type === type);
            
            if (!price) {
              price = queryRunner.manager.create(CurrencyPrice);
              price.currency = currency;
              price.type = type;
            }
            
            price.value = parseFloat(priceData.value.replace(/,/g, ''));
            price.sign = priceData.sign as CurrencyPriceSign;
            
            await queryRunner.manager.save(price);
          }

          updatedCount++;
        } catch (error) {
          this.logger.warn(`Failed to process currency ${currencyData.code}: ${error.message}`);
          continue;
        }
      }

      await queryRunner.commitTransaction();
      return `Successfully processed currencies: ${createdCount} created, ${updatedCount} updated`;
    } catch (error) {
      this.logger.error(`Seeding failed: ${error.message}`);
      await queryRunner.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Seed or update currency transactions
   * - Fetch transactions for each currency
   * - Handle multiple transactions per day
   * - Update existing transactions if found
   * - Create new transactions if not exists
   * - Track price changes with time and signs
   */
  async seeTransactionsData(): Promise<string> {
    const queryRunner = this.currencyRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get all currencies from database
      const currencies = await this.currencyRepository.find();
      let totalTransactions = 0;
      let updatedTransactions = 0;

      // Process each currency
      for (const currency of currencies) {
        try {
          // Get API configuration
          const refApiUrl = this.configService.get<string>('CURRENCY_API_URL') + 'currency/getTransactions';
          const token = this.configService.get<string>('CURRENCY_API_TOKEN');

          if (!token) {
            throw new Error('Please configure CURRENCY_API_TOKEN in your .env file');
          }

          // Fetch transactions from REF API
          const response = await firstValueFrom(
            this.httpService.get(refApiUrl, {
              headers: { Authorization: `Bearer ${token}` },
              params: {
                date: getCurrentDate(),
                which: currency.id,
                count: 10, // Fetch last 10 days of data
              },
            }),
          ).catch((error) => {
            this.logger.error(
              `API request failed for currency ${currency.code}: ${error.response?.data || error.message}`,
            );
            throw new Error(
              `API request failed for currency ${currency.code}: ${error.response?.data?.message || error.message}`,
            );
          });

          // Process each date group
          for (const dateGroup of response.data.data) {
            const date = convertToDate(dateGroup.date);

            // Process each transaction in the date group
            for (const transaction of dateGroup.transactions) {
              try {
                // Check if transaction exists
                let currencyTransaction = await queryRunner.manager.findOne(
                  CurrencyTransaction,
                  {
                    where: {
                      currency: { id: currency.id },
                      date: date,
                      time: transaction.time,
                    },
                  },
                );

                if (currencyTransaction) {
                  // Update existing transaction
                  currencyTransaction.buyValue = parseFloat(
                    transaction.prices[0].value.replace(/,/g, ''),
                  );
                  currencyTransaction.buySign = transaction.prices[0].sign as CurrencyPriceSign;
                  currencyTransaction.sellValue = parseFloat(
                    transaction.prices[1].value.replace(/,/g, ''),
                  );
                  currencyTransaction.sellSign = transaction.prices[1].sign as CurrencyPriceSign;
                  
                  await queryRunner.manager.save(currencyTransaction);
                  updatedTransactions++;
                } else {
                  // Create new transaction
                  currencyTransaction = new CurrencyTransaction();
                  currencyTransaction.currency = currency;
                  currencyTransaction.date = date;
                  currencyTransaction.time = transaction.time;
                  currencyTransaction.buyValue = parseFloat(
                    transaction.prices[0].value.replace(/,/g, ''),
                  );
                  currencyTransaction.buySign = transaction.prices[0].sign as CurrencyPriceSign;
                  currencyTransaction.sellValue = parseFloat(
                    transaction.prices[1].value.replace(/,/g, ''),
                  );
                  currencyTransaction.sellSign = transaction.prices[1].sign as CurrencyPriceSign;

                  await queryRunner.manager.save(currencyTransaction);
                  totalTransactions++;
                }
              } catch (error) {
                this.logger.warn(`Failed to process transaction: ${error.message}`);
                continue;
              }
            }
          }

          // Add delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          this.logger.warn(`Failed to process currency ${currency.code}: ${error.message}`);
          continue;
        }
      }

      await queryRunner.commitTransaction();
      return `Successfully processed transactions: ${totalTransactions} created, ${updatedTransactions} updated`;
    } catch (error) {
      this.logger.error(`Seeding transactions failed: ${error.message}`);
      await queryRunner.rollbackTransaction();
      throw new Error(`Seeding transactions failed: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Seed historical transactions for a specific currency
   * - Fetch transactions recursively using nextStartDate
   * - Continue fetching until reaching the target date or no more data
   * - Handle rate limiting with delays
   */
  async seedHistoricalTransactions(
    currencyId: number,
    startDate: string,
    endDate: string = getCurrentDate(),
  ): Promise<string> {
    const queryRunner = this.currencyRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get currency
      const currency = await this.currencyRepository.findOne({
        where: { id: currencyId },
      });

      if (!currency) {
        throw new Error(`Currency with ID ${currencyId} not found`);
      }

      let currentDate = endDate;
      let totalCreated = 0;
      let totalUpdated = 0;
      let hasMoreData = true;

      // Get API configuration
      const refApiUrl = this.configService.get<string>('CURRENCY_API_URL') + 'currency/getTransactions';
      const token = this.configService.get<string>('CURRENCY_API_TOKEN');

      if (!token) {
        throw new Error('Please configure CURRENCY_API_TOKEN in your .env file');
      }

      // Fetch data recursively until reaching start date or no more data
      while (hasMoreData && currentDate >= startDate) {
        try {
          this.logger.debug(`Fetching transactions for ${currency.code} from ${currentDate}`);

          // Fetch transactions from REF API
          const response = await firstValueFrom(
            this.httpService.get(refApiUrl, {
              headers: { Authorization: `Bearer ${token}` },
              params: {
                date: currentDate,
                which: currency.id,
                count: 30, // Fetch maximum days allowed
              },
            }),
          );

          // Process each date group
          for (const dateGroup of response.data.data) {
            const date = convertToDate(dateGroup.date);

            // Skip if date is before start date
            if (date < new Date(startDate)) {
              hasMoreData = false;
              break;
            }

            // Process each transaction
            for (const transaction of dateGroup.transactions) {
              try {
                // Check if transaction exists
                let currencyTransaction = await queryRunner.manager.findOne(
                  CurrencyTransaction,
                  {
                    where: {
                      currency: { id: currency.id },
                      date: date,
                      time: transaction.time,
                    },
                  },
                );

                if (currencyTransaction) {
                  // Update existing transaction
                  currencyTransaction.buyValue = parseFloat(
                    transaction.prices[0].value.replace(/,/g, ''),
                  );
                  currencyTransaction.buySign = transaction.prices[0].sign as CurrencyPriceSign;
                  currencyTransaction.sellValue = parseFloat(
                    transaction.prices[1].value.replace(/,/g, ''),
                  );
                  currencyTransaction.sellSign = transaction.prices[1].sign as CurrencyPriceSign;
                  
                  await queryRunner.manager.save(currencyTransaction);
                  totalUpdated++;
                } else {
                  // Create new transaction
                  currencyTransaction = new CurrencyTransaction();
                  currencyTransaction.currency = currency;
                  currencyTransaction.date = date;
                  currencyTransaction.time = transaction.time;
                  currencyTransaction.buyValue = parseFloat(
                    transaction.prices[0].value.replace(/,/g, ''),
                  );
                  currencyTransaction.buySign = transaction.prices[0].sign as CurrencyPriceSign;
                  currencyTransaction.sellValue = parseFloat(
                    transaction.prices[1].value.replace(/,/g, ''),
                  );
                  currencyTransaction.sellSign = transaction.prices[1].sign as CurrencyPriceSign;

                  await queryRunner.manager.save(currencyTransaction);
                  totalCreated++;
                }
              } catch (error) {
                this.logger.warn(`Failed to process transaction: ${error.message}`);
                continue;
              }
            }
          }

          // Update current date to next batch
          if (response.data.nextStartDate && response.data.nextStartDate >= startDate) {
            currentDate = response.data.nextStartDate;
          } else {
            hasMoreData = false;
          }

          // Add delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          this.logger.error(
            `Failed to fetch transactions for ${currency.code} from ${currentDate}: ${error.message}`,
          );
          throw error;
        }
      }

      await queryRunner.commitTransaction();
      return `Successfully processed historical transactions for ${currency.code}: ${totalCreated} created, ${totalUpdated} updated`;
    } catch (error) {
      this.logger.error(`Seeding historical transactions failed: ${error.message}`);
      await queryRunner.rollbackTransaction();
      throw new Error(`Seeding historical transactions failed: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }
}
