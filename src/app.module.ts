import { CommonModule } from '@common/common.module';
import { DatabaseModule } from '@database/database.module';
import { CurrencyModule } from '@domain/currency/currency.module';
import { EnvModule } from '@env/env.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    EnvModule,
    CommonModule,
    DatabaseModule,
    CurrencyModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
