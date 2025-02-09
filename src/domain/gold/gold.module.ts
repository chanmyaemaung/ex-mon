import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoldController } from './controllers/gold.controller';
import { GoldPrice } from './entities/gold-price.entity';
import { GoldTransaction } from './entities/gold-transaction.entity';
import { Gold } from './entities/gold.entity';
import { GoldService } from './services/gold.service';

@Module({
  imports: [TypeOrmModule.forFeature([Gold, GoldTransaction, GoldPrice])],
  controllers: [GoldController],
  providers: [GoldService],
  exports: [],
})
export class GoldModule {}
