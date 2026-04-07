import type { SupabaseClient } from "@supabase/supabase-js";
import type { Conversation, ChatMessage } from "../ai/types";

export async function getConversations(
  client: SupabaseClient,
  userId: string
): Promise<Conversation[]> {
  const { data, error } = await client
    .from("ai_conversations")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}

export async function getConversation(
  client: SupabaseClient,
  id: string
): Promise<Conversation | null> {
  const { data, error } = await client
    .from("ai_conversations")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function createConversation(
  client: SupabaseClient,
  userId: string,
  title: string | null,
  messages: ChatMessage[]
): Promise<Conversation> {
  const { data, error } = await client
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
  client: SupabaseClient,
  id: string,
  messages: ChatMessage[],
  title?: string
): Promise<Conversation> {
  const updates: Record<string, unknown> = {
    messages: JSON.parse(JSON.stringify(messages)),
    updated_at: new Date().toISOString(),
  };
  if (title !== undefined) updates.title = title;

  const { data, error } = await client
    .from("ai_conversations")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteConversation(
  client: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await client
    .from("ai_conversations")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
