'use server'

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

export async function getUserChats() {
  const supabase = await createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: chats, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching chats:', error);
    return [];
  }

  return chats;
}


export async function createNewChat() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        throw new Error("Unauthorized");
    }

    const { data, error } = await supabase.from('chat_sessions').insert({
        user_id: user.id,
        title: 'Nuevo Chat'
    }).select().single();

    if (error) {
        throw error;
    }

    return data;
}

import { updateSessionTitle } from "@/lib/chat-memory";

export async function updateChatSessionTitle(sessionId: string, title: string) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        throw new Error("Unauthorized");
    }

    // Verify ownership
    const { data: session } = await supabase
        .from('chat_sessions')
        .select('user_id')
        .eq('id', sessionId)
        .single();
        
    if (!session || session.user_id !== user.id) {
        throw new Error("Unauthorized");
    }

    return await updateSessionTitle(sessionId, title);
}
