import { CommonModule } from '@common/common.module';
import { DatabaseModule } from '@database/database.module';
import { EnvModule } from '@env/env.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [EnvModule, CommonModule, DatabaseModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
