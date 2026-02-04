import { Injectable } from '@nestjs/common';
import { SupabaseService } from '@app/common';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

@Injectable()
export class RepoService {
  private sqsClient = new SQSClient({ region: 'ap-south-1' });

  constructor(private readonly supabase: SupabaseService) {}

  async addProject(repoUrl: string, githubToken?: string) {
    const client = this.supabase.getClient();

    const formattedRepoUrl = repoUrl.replace(/\/$/, '');

    console.log(formattedRepoUrl);

    // --- IDEMPOTENCY CHECK ---
    // 1. Check if this repo is already in our DB
    const { data: existingProjects } = await client
      .from('projects')
      .select('*')
      .eq('repo_url', formattedRepoUrl)
      .limit(1);

    console.log('existingProject', JSON.stringify(existingProjects));

    // Check if the array exists and has at least one item
    if (existingProjects && existingProjects.length > 0) {
      console.log(`♻️ Project already exists: ${existingProjects[0].id}`);
      return {
        message: 'Project Already Exist',
        data: existingProjects[0],
      };
    }
    // -------------------------

    // 2. If not found, Insert New Project
    const { data, error } = await client
      .from('projects')
      .insert({ repo_url: repoUrl, status: 'pending' })
      .select()
      .single();

    if (error) {
      throw new Error(`Database Error: ${error.message}`);
    }

    // 3. Push to SQS
    const queueUrl = process.env.SQS_QUEUE_URL;
    if (queueUrl) {
      await this.sqsClient.send(
        new SendMessageCommand({
          QueueUrl: queueUrl,
          MessageBody: JSON.stringify({
            projectId: data.id,
            repoUrl: data.repo_url,
            githubToken,
          }),
        }),
      );
    }

    return data;
  }

  async getProject(id: string) {
    const { data } = await this.supabase
      .getClient()
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    return data;
  }
}
