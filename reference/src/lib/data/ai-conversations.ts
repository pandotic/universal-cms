import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { Conversation, ChatMessage } from "@/lib/ai/types";

export async function getConversations(userId: string): Promise<Conversation[]> {
  const supabase = await getSupabaseAdmin();
  const { data, error } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const supabase = await getSupabaseAdmin();
  const { data, error } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function createConversation(
  userId: string,
  title: string | null,
  messages: ChatMessage[]
): Promise<Conversation> {
  const supabase = await getSupabaseAdmin();
  const { data, error } = await supabase
    .from("ai_conversations")
    .insert({
      user_id: userId,
      title,
      messages: JSON.parse(JSON.stringify(messages)),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateConversationMessages(
  id: string,
  messages: ChatMessage[],
  title?: string
): Promise<Conversation> {
  const supabase = await getSupabaseAdmin();
  const updates: Record<string, unknown> = {
    messages: JSON.parse(JSON.stringify(messages)),
    updated_at: new Date().toISOString(),
  };
  if (title !== undefined) updates.title = title;

  const { data, error } = await supabase
    .from("ai_conversations")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteConversation(id: string): Promise<void> {
  const supabase = await getSupabaseAdmin();
  const { error } = await supabase
    .from("ai_conversations")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
