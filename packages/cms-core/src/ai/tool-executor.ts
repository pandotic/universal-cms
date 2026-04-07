import type { SupabaseClient } from "@supabase/supabase-js";
import type { ToolResultDisplay } from "./types";
import type { PageType, PageStatus } from "../data/content-pages";
import {
  getAllContentPages,
  getContentPageById,
  getContentPageBySlug,
  createContentPage,
  updateContentPage,
  deleteContentPage,
} from "../data/content-pages";
import {
  getSetting,
  getAllSettings,
  getSettingsByGroup,
  updateSetting,
} from "../data/site-settings";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Execute a tool call and return a display-friendly result.
 */
export async function executeTool(
  client: SupabaseClient,
  name: string,
  input: Record<string, unknown>
): Promise<{ raw: unknown; display: ToolResultDisplay }> {
  switch (name) {
    // ─── Content Pages ────────────────────────────────────────────
    case "list_content_pages": {
      let pages = await getAllContentPages(client);
      if (input.status)
        pages = pages.filter((p) => p.status === input.status);
      if (input.page_type)
        pages = pages.filter((p) => p.page_type === input.page_type);
      const limit = (input.limit as number) || 25;
      pages = pages.slice(0, limit);
      const summary = pages.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        status: p.status,
        page_type: p.page_type,
        updated_at: p.updated_at,
      }));
      return {
        raw: summary,
        display: {
          toolName: name,
          success: true,
          summary: `Found ${pages.length} content page${pages.length !== 1 ? "s" : ""}`,
          data: { pages: summary },
        },
      };
    }

    case "get_content_page": {
      const page = input.id
        ? await getContentPageById(client, input.id as string)
        : input.slug
          ? await getContentPageBySlug(client, input.slug as string)
          : null;
      if (!page) {
        return {
          raw: null,
          display: {
            toolName: name,
            success: false,
            summary: "Content page not found",
          },
        };
      }
      return {
        raw: page,
        display: {
          toolName: name,
          success: true,
          summary: `Found "${page.title}" (${page.status})`,
          data: {
            id: page.id,
            title: page.title,
            slug: page.slug,
            status: page.status,
            page_type: page.page_type,
          },
          link: {
            label: "Edit page",
            href: `/admin/content-pages`,
          },
        },
      };
    }

    case "create_content_page": {
      const slug =
        (input.slug as string) || slugify(input.title as string);
      const page = await createContentPage(client, {
        title: input.title as string,
        slug,
        page_type: ((input.page_type as string) || "article") as PageType,
        body: (input.body as string) || null,
        excerpt: (input.excerpt as string) || null,
        status: ((input.status as string) || "draft") as PageStatus,
        seo_title: (input.seo_title as string) || null,
        seo_description: (input.seo_description as string) || null,
      });
      return {
        raw: page,
        display: {
          toolName: name,
          success: true,
          summary: `Created "${page.title}" (${page.status})`,
          data: {
            id: page.id,
            title: page.title,
            slug: page.slug,
            status: page.status,
          },
          link: {
            label: "Edit page",
            href: `/admin/content-pages`,
          },
        },
      };
    }

    case "update_content_page": {
      const { id, ...updates } = input;
      const page = await updateContentPage(client, id as string, updates);
      return {
        raw: page,
        display: {
          toolName: name,
          success: true,
          summary: `Updated "${page.title}"`,
          data: {
            id: page.id,
            title: page.title,
            status: page.status,
            updated_fields: Object.keys(updates),
          },
          link: { label: "Edit page", href: `/admin/content-pages` },
        },
      };
    }

    case "delete_content_page": {
      await deleteContentPage(client, input.id as string);
      return {
        raw: { deleted: true },
        display: {
          toolName: name,
          success: true,
          summary: `Deleted content page ${input.id}`,
        },
      };
    }

    // ─── Directory Entities ───────────────────────────────────────
    case "list_entities": {
      let query = client.from("entities").select("id,name,slug,type,status,website");
      if (input.status) query = query.eq("status", input.status as string);
      if (input.type) query = query.eq("type", input.type as string);
      if (input.search)
        query = query.ilike("name", `%${input.search as string}%`);
      query = query.order("sort_order").limit((input.limit as number) || 25);
      const { data, error } = await query;
      if (error) throw error;
      return {
        raw: data,
        display: {
          toolName: name,
          success: true,
          summary: `Found ${data?.length ?? 0} entities`,
          data: { entities: data },
        },
      };
    }

    case "get_entity": {
      let query = client.from("entities").select("*");
      if (input.id) query = query.eq("id", input.id as string);
      else if (input.slug) query = query.eq("slug", input.slug as string);
      const { data, error } = await query.single();
      if (error || !data) {
        return {
          raw: null,
          display: { toolName: name, success: false, summary: "Entity not found" },
        };
      }
      return {
        raw: data,
        display: {
          toolName: name,
          success: true,
          summary: `Found "${data.name}"`,
          data: { id: data.id, name: data.name, slug: data.slug, status: data.status },
          link: { label: "Edit entity", href: `/admin/directory/${data.id}` },
        },
      };
    }

    case "create_entity": {
      const { data, error } = await client
        .from("entities")
        .insert({
          name: input.name,
          slug: input.slug || slugify(input.name as string),
          type: input.type || "platform",
          description: input.description || null,
          website: input.website || null,
          logo_url: input.logo_url || null,
          status: input.status || "draft",
        })
        .select()
        .single();
      if (error) throw error;
      return {
        raw: data,
        display: {
          toolName: name,
          success: true,
          summary: `Created "${data.name}" (${data.status})`,
          data: { id: data.id, name: data.name, slug: data.slug },
          link: { label: "Edit entity", href: `/admin/directory/${data.id}` },
        },
      };
    }

    case "update_entity": {
      const { id, ...updates } = input;
      const { data, error } = await client
        .from("entities")
        .update(updates)
        .eq("id", id as string)
        .select()
        .single();
      if (error) throw error;
      return {
        raw: data,
        display: {
          toolName: name,
          success: true,
          summary: `Updated "${data.name}"`,
          data: { id: data.id, name: data.name, updated_fields: Object.keys(updates) },
          link: { label: "Edit entity", href: `/admin/directory/${data.id}` },
        },
      };
    }

    // ─── Categories ───────────────────────────────────────────────
    case "list_categories": {
      const { data, error } = await client
        .from("categories")
        .select("id,name,slug,layer,sort_order")
        .order("sort_order");
      if (error) throw error;
      return {
        raw: data,
        display: {
          toolName: name,
          success: true,
          summary: `Found ${data?.length ?? 0} categories`,
          data: { categories: data },
        },
      };
    }

    case "create_category": {
      const { data, error } = await client
        .from("categories")
        .insert({
          name: input.name,
          slug: input.slug || slugify(input.name as string),
          description: input.description || null,
          layer: input.layer || null,
          parent_id: input.parent_id || null,
        })
        .select()
        .single();
      if (error) throw error;
      return {
        raw: data,
        display: {
          toolName: name,
          success: true,
          summary: `Created category "${data.name}"`,
          data: { id: data.id, name: data.name, slug: data.slug },
          link: { label: "View categories", href: "/admin/categories" },
        },
      };
    }

    // ─── Site Settings ────────────────────────────────────────────
    case "get_site_setting": {
      const value = await getSetting(client, input.key as string);
      return {
        raw: value,
        display: {
          toolName: name,
          success: value !== null,
          summary: value !== null
            ? `Setting "${input.key}" found`
            : `Setting "${input.key}" not found`,
          data: value ? { key: input.key, value } : undefined,
        },
      };
    }

    case "update_site_setting": {
      const setting = await updateSetting(
        client,
        input.key as string,
        input.value as Record<string, unknown>
      );
      return {
        raw: setting,
        display: {
          toolName: name,
          success: true,
          summary: `Updated setting "${setting.key}"`,
          data: { key: setting.key, value: setting.value },
          link: { label: "View settings", href: "/admin/settings" },
        },
      };
    }

    case "list_site_settings": {
      const settings = input.group_name
        ? await getSettingsByGroup(client, input.group_name as string)
        : await getAllSettings(client);
      const summary = settings.map((s) => ({
        key: s.key,
        group_name: s.group_name,
        value: s.value,
      }));
      return {
        raw: summary,
        display: {
          toolName: name,
          success: true,
          summary: `Found ${settings.length} settings`,
          data: { settings: summary },
        },
      };
    }

    // ─── Media ────────────────────────────────────────────────────
    case "list_media": {
      const limit = (input.limit as number) || 25;
      const { data, error } = await client
        .from("content_media")
        .select("id,filename,storage_path,mime_type,alt_text,created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return {
        raw: data,
        display: {
          toolName: name,
          success: true,
          summary: `Found ${data?.length ?? 0} media items`,
          data: { media: data },
        },
      };
    }

    // ─── Redirects ────────────────────────────────────────────────
    case "list_redirects": {
      const { data, error } = await client
        .from("redirects")
        .select("id,from_path,to_path,status_code,is_active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return {
        raw: data,
        display: {
          toolName: name,
          success: true,
          summary: `Found ${data?.length ?? 0} redirects`,
          data: { redirects: data },
        },
      };
    }

    case "create_redirect": {
      const { data, error } = await client
        .from("redirects")
        .insert({
          from_path: input.from_path,
          to_path: input.to_path,
          status_code: input.status_code || 301,
          is_active: input.is_active ?? true,
        })
        .select()
        .single();
      if (error) throw error;
      return {
        raw: data,
        display: {
          toolName: name,
          success: true,
          summary: `Created redirect: ${data.from_path} → ${data.to_path} (${data.status_code})`,
          data: { id: data.id, from_path: data.from_path, to_path: data.to_path },
          link: { label: "View redirects", href: "/admin/seo/redirects" },
        },
      };
    }

    // ─── Activity Log ─────────────────────────────────────────────
    case "list_activity_log": {
      let query = client
        .from("activity_log")
        .select("id,action,entity_type,entity_title,user_id,created_at")
        .order("created_at", { ascending: false })
        .limit((input.limit as number) || 20);
      if (input.action) query = query.eq("action", input.action as string);
      const { data, error } = await query;
      if (error) throw error;
      return {
        raw: data,
        display: {
          toolName: name,
          success: true,
          summary: `Found ${data?.length ?? 0} activity entries`,
          data: { entries: data },
        },
      };
    }

    // ─── Reviews ──────────────────────────────────────────────────
    case "list_reviews": {
      let query = client
        .from("reviews")
        .select("id,entity_id,display_name,rating,title,status,created_at")
        .order("created_at", { ascending: false })
        .limit((input.limit as number) || 25);
      if (input.status) query = query.eq("status", input.status as string);
      const { data, error } = await query;
      if (error) throw error;
      return {
        raw: data,
        display: {
          toolName: name,
          success: true,
          summary: `Found ${data?.length ?? 0} reviews`,
          data: { reviews: data },
        },
      };
    }

    case "update_review_status": {
      const { data, error } = await client
        .from("reviews")
        .update({ status: input.status })
        .eq("id", input.id as string)
        .select("id,display_name,status")
        .single();
      if (error) throw error;
      return {
        raw: data,
        display: {
          toolName: name,
          success: true,
          summary: `Review by "${data.display_name}" set to ${data.status}`,
          data: { id: data.id, status: data.status },
          link: { label: "View reviews", href: "/admin/reviews" },
        },
      };
    }

    // ─── Unknown ──────────────────────────────────────────────────
    default:
      return {
        raw: { error: `Unknown tool: ${name}` },
        display: {
          toolName: name,
          success: false,
          summary: `Unknown tool: ${name}`,
        },
      };
  }
}
