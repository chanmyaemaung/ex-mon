import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './config/database-config';

@Module({
  imports: [TypeOrmModule.forRootAsync(databaseConfig.asProvider())],
  controllers: [],
  providers: [],
})
export class DatabaseModule {}
