import { Injectable } from '@nestjs/common';
import { SupabaseService, GeminiService } from '@app/common';

@Injectable()
export class ChatService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly gemini: GeminiService,
  ) {}

  async askQuestion(projectId: string, question: string) {
    // 1. Convert user question to vector
    const questionEmbedding = await this.gemini.generateEmbedding(question);

    // 2. Search for relevant code chunks in Supabase
    // We call the RPC function 'match_documents' we created in Phase 1
    const { data: chunks, error } = await this.supabase
      .getClient()
      .rpc('match_documents', {
        query_embedding: questionEmbedding,
        match_threshold: 0.5, // Similarity threshold (0.5 is a good baseline)
        match_count: 5, // Retrieve top 5 most relevant snippets
        filter_project_id: projectId,
      });

    if (error) {
      throw new Error(`Vector search failed: ${error.message}`);
    }

    if (!chunks || chunks.length === 0) {
      return "I couldn't find any relevant code in this project to answer your question.";
    }

    // 3. Construct the Context Blob
    const contextText = chunks
      .map((chunk) => `File: ${chunk.file_path}\nCode:\n${chunk.content}`)
      .join('\n\n---\n\n');

    // 4. Build the Prompt
    const prompt = `
      You are an expert software architect acting as an onboarding assistant.
      Use the following code context to answer the user's question.
      
      CONTEXT FROM CODEBASE:
      ${contextText}

      USER QUESTION:
      ${question}

      INSTRUCTIONS:
      - Answer strictly based on the provided context.
      - If the context doesn't contain the answer, say "I don't see that in the code provided."
      - Use Markdown formatting for code blocks.
    `;

    // 5. Generate Answer
    const answer = await this.gemini.generateResponse(prompt);

    return { answer, sources: chunks.map((c) => c.file_path) };
  }
}
