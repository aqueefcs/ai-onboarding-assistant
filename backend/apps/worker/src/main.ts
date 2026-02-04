import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';
import { IngestionService } from './ingestion/ingestion.service';
import { Context, SQSEvent, Callback } from 'aws-lambda';

export const handler = async (
  event: SQSEvent,
  context: Context,
  callback: Callback,
) => {
  const appContext = await NestFactory.createApplicationContext(WorkerModule);
  const ingestionService = appContext.get(IngestionService);

  try {
    for (const record of event.Records) {
      const body = JSON.parse(record.body);
      const { projectId, repoUrl, githubToken } = body;

      if (projectId && repoUrl) {
        await ingestionService.processRepo(projectId, repoUrl, githubToken);
      }
    }
    await appContext.close();
    callback(null, 'Success');
  } catch (error) {
    console.error(error);
    await appContext.close();
    callback(error);
  }
};
