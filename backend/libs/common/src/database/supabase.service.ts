import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private client: SupabaseClient;

  onModuleInit() {
    // 1. Get credentials from environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY; // The Service Role Key

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL or Key is missing in .env');
    }

    // 2. Initialize the client
    this.client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false, // Server-side usage doesn't need sessions
        autoRefreshToken: false,
      },
    });

    console.log('✅ Supabase Client Initialized');
  }

  getClient(): SupabaseClient {
    return this.client;
  }
}
