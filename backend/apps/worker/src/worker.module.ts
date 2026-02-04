import { Module } from '@nestjs/common';
import { WorkerController } from './worker.controller';
import { WorkerService } from './worker.service';
import { ConfigModule } from '@nestjs/config';
import { IngestionModule } from './ingestion/ingestion.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), IngestionModule],
  controllers: [WorkerController],
  providers: [WorkerService],
})
export class WorkerModule {}
