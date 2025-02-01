import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurrencyController } from './controllers/currency.controller';
import { CurrencyPrice } from './entities/currency-price.entity';
import { CurrencyTransaction } from './entities/currency-transaction.entity';
import { Currency } from './entities/currency.entity';
import { CurrencyService } from './services/currency.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Currency, CurrencyPrice, CurrencyTransaction]),
  ],
  controllers: [CurrencyController],
  providers: [CurrencyService],
  exports: [],
})
export class CurrencyModule {}
