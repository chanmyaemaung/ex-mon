import { BullModule } from '@nestjs/bull';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurrencySeedController } from './controllers/currency-seed.controller';
import { CurrencyController } from './controllers/currency.controller';
import { CurrencyPrice } from './entities/currency-price.entity';
import { CurrencyTransaction } from './entities/currency-transaction.entity';
import { Currency } from './entities/currency.entity';
import { CurrencySeedProcessor } from './processors/currency-seed.processor';
import { CurrencySeedService } from './services/currency-seed.service';
import { CurrencyService } from './services/currency.service';
import { CurrencyQueueService } from './queues/currency.queue';

@Module({
  imports: [
    TypeOrmModule.forFeature([Currency, CurrencyTransaction, CurrencyPrice]),
    HttpModule,
    ConfigModule,
    BullModule.registerQueue({
      name: 'currency-sync',
    }),
  ],
  controllers: [CurrencyController, CurrencySeedController],
  providers: [
    CurrencyService, 
    CurrencySeedService, 
    CurrencySeedProcessor,
    CurrencyQueueService
  ],
  exports: [],
})
export class CurrencyModule {}
