import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { VALIDATION_PIPE_OPTIONS } from './utils';
import { QueueModule } from './modules/queue/queue.module';

@Module({
  imports: [QueueModule],
  controllers: [],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe(VALIDATION_PIPE_OPTIONS),
    },
  ],
  exports: [QueueModule],
})
export class CommonModule {}
