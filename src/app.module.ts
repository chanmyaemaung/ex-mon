import { CommonModule } from '@common/common.module';
import { DatabaseModule } from '@database/database.module';
import { CurrencyModule } from '@domain/currency/currency.module';
import { GoldModule } from '@domain/gold/gold.module';
import { EnvModule } from '@env/env.module';
import { Module } from '@nestjs/common';


@Module({
  imports: [
    EnvModule,
    CommonModule,
    DatabaseModule,
    CurrencyModule,
    GoldModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
