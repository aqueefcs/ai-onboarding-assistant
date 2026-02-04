import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private embeddingModel: GenerativeModel;
  private chatModel: GenerativeModel;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is missing');

    this.genAI = new GoogleGenerativeAI(apiKey);

    // Initialize models
    // 'text-embedding-004' is the latest model for vectors (768 dimensions)
    this.embeddingModel = this.genAI.getGenerativeModel({
      model: 'text-embedding-004',
    });

    // 'gemini-1.5-flash' is the fastest/cheapest model for chat
    this.chatModel = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
    });
  }

  // 1. Convert text to vector
  async generateEmbedding(text: string): Promise<number[]> {
    const result = await this.embeddingModel.embedContent(text);
    const embedding = result.embedding;
    return embedding.values;
  }

  // 2. Chat with the AI
  async generateResponse(prompt: string): Promise<string> {
    const result = await this.chatModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }
}
