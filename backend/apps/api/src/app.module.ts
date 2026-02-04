import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // <-- Import this
import { DatabaseModule, AiModule } from '@app/common';
import { RepoModule } from './repo/repo.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    // 1. Add ConfigModule.forRoot() at the top
    ConfigModule.forRoot({
      isGlobal: true, // Makes .env available everywhere
    }),
    DatabaseModule,
    AiModule,
    RepoModule,
    ChatModule,
  ],
})
export class AppModule {}
