import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { usernameToEmail } from "./username";

const usernameSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9_.-]{3,24}$/, "Usuário: 3-24 letras, números, _ . -");
const passwordSchema = z.string().min(6, "Senha mínima de 6 caracteres").max(72);

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Acesso negado");
}

export const getSetupStatus = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const { count } = await sb.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "admin");
  return { needsSetup: (count ?? 0) === 0 };
});

export const createFirstAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ username: usernameSchema, password: passwordSchema }).parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const { count } = await sb.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "admin");
    if ((count ?? 0) > 0) throw new Error("Administrador já existe");
    const { data: u, error } = await sb.auth.admin.createUser({ email: usernameToEmail(data.username), password: data.password, email_confirm: true });
    if (error || !u.user) throw new Error(error?.message ?? "Falha ao criar");
    await sb.from("profiles").insert({ id: u.user.id, username: data.username, expires_at: null });
    await sb.from("user_roles").insert({ user_id: u.user.id, role: "admin" });
    return { ok: true };
  });

export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile } = await context.supabase.from("profiles").select("username, expires_at").eq("id", context.userId).maybeSingle();
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    const expired = !isAdmin && (!profile || (profile.expires_at !== null && new Date(profile.expires_at) < new Date()));
    return { username: profile?.username ?? "?", expiresAt: profile?.expires_at ?? null, isAdmin: !!isAdmin, expired, noProfile: !profile };
  });

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: profiles } = await context.supabase.from("profiles").select("id, username, expires_at, created_at").order("created_at", { ascending: false });
    const { data: roles } = await context.supabase.from("user_roles").select("user_id, role").eq("role", "admin");
    const admins = new Set((roles ?? []).map((r) => r.user_id));
    return (profiles ?? []).map((p) => ({ ...p, isAdmin: admins.has(p.id) }));
  });

export const createAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ username: usernameSchema, password: passwordSchema, expiresAt: z.string().datetime().nullable() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const sb = await admin();
    const { data: u, error } = await sb.auth.admin.createUser({ email: usernameToEmail(data.username), password: data.password, email_confirm: true });
    if (error || !u.user) throw new Error(error?.message?.includes("already") ? "Usuário já existe" : error?.message ?? "Falha");
    const { error: e2 } = await sb.from("profiles").insert({ id: u.user.id, username: data.username, expires_at: data.expiresAt });
    if (e2) { await sb.auth.admin.deleteUser(u.user.id); throw new Error("Usuário já existe"); }
    return { ok: true };
  });

export const updateAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), expiresAt: z.string().datetime().nullable().optional(), password: passwordSchema.optional() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const sb = await admin();
    if (data.expiresAt !== undefined) await sb.from("profiles").update({ expires_at: data.expiresAt }).eq("id", data.id);
    if (data.password) {
      const { error } = await sb.auth.admin.updateUserById(data.id, { password: data.password });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.id === context.userId) throw new Error("Você não pode excluir a si mesmo");
    const sb = await admin();
    const { error } = await sb.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
