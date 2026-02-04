import { Module, Global } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

@Global() // <-- IMPORTANT: Global means we don't have to import it everywhere
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService], // Let other modules use the service
})
export class DatabaseModule {}
