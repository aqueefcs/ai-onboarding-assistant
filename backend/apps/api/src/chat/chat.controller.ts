import { Body, Controller, Post } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(@Body() body: { projectId: string; question: string }) {
    if (!body.projectId || !body.question) {
      return { error: 'projectId and question are required' };
    }
    return this.chatService.askQuestion(body.projectId, body.question);
  }
}
