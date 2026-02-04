import { Module } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { DatabaseModule, AiModule } from '@app/common';

@Module({
  imports: [DatabaseModule, AiModule],
  providers: [IngestionService],
  exports: [IngestionService],
})
export class IngestionModule {}
