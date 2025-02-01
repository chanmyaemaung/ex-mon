import { ENV_VALIDATION_SCHEMA } from '@common/utils';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      expandVariables: true,
      validationSchema: ENV_VALIDATION_SCHEMA,
    }),
  ],
})
export class EnvModule {}
