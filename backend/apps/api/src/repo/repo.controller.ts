import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { RepoService } from './repo.service';

@Controller('projects')
export class RepoController {
  constructor(private readonly repoService: RepoService) {}

  @Post()
  async createProject(
    @Body('repoUrl') repoUrl: string,
    @Body('githubToken') githubToken?: string, // <--- Add this optional parameter
  ) {
    if (!repoUrl || !repoUrl.includes('github.com')) {
      return { error: 'Invalid GitHub URL' };
    }
    return this.repoService.addProject(repoUrl, githubToken);
  }

  // --- ADD THIS GET ENDPOINT ---
  @Get(':id')
  async getProjectStatus(@Param('id') id: string) {
    const project = await this.repoService.getProject(id);
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }
}
