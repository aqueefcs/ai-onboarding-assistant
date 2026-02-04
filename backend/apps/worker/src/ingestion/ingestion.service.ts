import { Injectable } from '@nestjs/common';
import * as git from 'isomorphic-git';
import * as http from 'isomorphic-git/http/node';
import * as fs from 'fs-extra';
import * as path from 'path';
import { SupabaseService, GeminiService } from '@app/common'; // Our shared libs

@Injectable()
export class IngestionService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly gemini: GeminiService,
  ) {}

  async processRepo(projectId: string, repoUrl: string, githubToken?: string) {
    console.log(`🚀 Starting job for: ${repoUrl}`);

    // 1. Define a temporary path (Lambda only allows writing to /tmp)
    const projectPath = path.join('/tmp', projectId);

    try {
      // 2. Clone the Repo
      await this.cloneRepo(repoUrl, projectPath, githubToken);

      // 3. Find all files
      const files = await this.getFiles(projectPath);
      console.log(`Found ${files.length} files to process.`);

      // 4. Loop, Chunk, and Embed
      for (const file of files) {
        await this.processFile(projectId, file, projectPath);
      }

      // 5. Update Status to "Completed"
      await this.updateStatus(projectId, 'completed');
      console.log(`✅ Job finished for ${projectId}`);
    } catch (error) {
      console.error(`❌ Job failed:`, error);
      await this.updateStatus(projectId, 'failed');
    } finally {
      // 6. Cleanup (Crucial for Lambda disk space)
      await fs.remove(projectPath);
    }
  }

  private async cloneRepo(url: string, dir: string, token?: string) {
    console.log(`Cloning... ${token ? '(with auth)' : '(public)'}`);

    await git.clone({
      fs,
      http,
      dir,
      url,
      singleBranch: true,
      depth: 1,
      // The Magic Part:
      onAuth: () => {
        if (!token) return; // No token? No auth.
        // For GitHub, use the token as the password. Username can be anything.
        return { username: 'x-access-token', password: token };
      },
    });
  }

  private async getFiles(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { recursive: true });
    // Filter logic: Only keep code files, ignore node_modules, images, etc.
    // Note: recursive readdir returns paths relative to 'dir' in Node 20+,
    // but ensures we get full list.

    // Simple recursive walker if node version varies or strictly controlling ignore list:
    // For now, let's use a simpler approach assuming standard Node 20 behavior or manual walk
    // Let's stick to a robust manual walk to be safe:
    return this.walk(dir);
  }

  private async walk(dir: string, fileList: string[] = []): Promise<string[]> {
    const files = await fs.readdir(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);

      // Ignore common junk
      if (file.startsWith('.') || file === 'node_modules' || file === 'dist')
        continue;

      if (stat.isDirectory()) {
        await this.walk(filePath, fileList);
      } else {
        // Only allow specific extensions
        if (file.match(/\.(ts|js|jsx|tsx|py|java|go|rs|md)$/)) {
          fileList.push(filePath);
        }
      }
    }
    return fileList;
  }

  private async updateStatus(projectId: string, status: string) {
    await this.supabase
      .getClient()
      .from('projects')
      .update({ status })
      .eq('id', projectId);
  }

  private async processFile(
    projectId: string,
    filePath: string,
    rootDir: string,
  ) {
    const content = await fs.readFile(filePath, 'utf-8');
    const relativePath = path.relative(rootDir, filePath);

    // 1. Chunk the code (Simple splitter)
    // We split by 1000 chars with 100 overlap
    const chunks = this.splitText(content, 1000, 100);

    console.log(`Processing ${relativePath}: ${chunks.length} chunks`);

    for (const chunk of chunks) {
      // 2. Generate Embedding (Vector)
      // We add a small delay to respect Gemini Free Tier limits (15 RPM)
      await new Promise((r) => setTimeout(r, 4000)); // 4 sec delay = ~15 req/min

      const vector = await this.gemini.generateEmbedding(chunk);

      // 3. Save to Supabase
      await this.supabase.getClient().from('documents').insert({
        project_id: projectId,
        file_path: relativePath,
        content: chunk,
        embedding: vector,
      });
    }
  }

  private splitText(
    text: string,
    chunkSize: number,
    overlap: number,
  ): string[] {
    const chunks: string[] = [];
    let i = 0;
    while (i < text.length) {
      chunks.push(text.slice(i, i + chunkSize));
      i += chunkSize - overlap;
    }
    return chunks;
  }
}
