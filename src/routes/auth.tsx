import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createFirstAdmin, getSetupStatus } from "@/lib/accounts.functions";
import { usernameToEmail } from "@/lib/username";
import { Logo } from "@/components/scarface/Logo";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — SCARFACE OPTIMIZER" },
      { name: "description", content: "Acesse o painel SCARFACE OPTIMIZER com seu login." },
      { property: "og:title", content: "Entrar — SCARFACE OPTIMIZER" },
      { property: "og:description", content: "Acesse o painel SCARFACE OPTIMIZER com seu login." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const setupStatus = useServerFn(getSetupStatus);
  const firstAdmin = useServerFn(createFirstAdmin);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setupStatus().then((r) => setNeedsSetup(r.needsSetup)).catch(() => {});
    supabase.auth.getUser().then(({ data }) => { if (data.user) navigate({ to: "/panel" }); });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (needsSetup) await firstAdmin({ data: { username, password } });
      const { error } = await supabase.auth.signInWithPassword({ email: usernameToEmail(username), password });
      if (error) throw new Error("Usuário ou senha inválidos");
      navigate({ to: "/panel" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-8 shadow-glow">
        <div className="flex justify-center"><Logo /></div>
        {needsSetup && (
          <p className="rounded-md border border-gold/40 bg-accent p-3 text-sm text-gold">
            Primeiro acesso: crie a conta de administrador.
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="u">Usuário</Label>
          <Input id="u" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p">Senha</Label>
          <Input id="p" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </div>
        <Button type="submit" variant="hero" className="h-11 w-full" disabled={busy}>
          {busy ? "Aguarde..." : needsSetup ? "Criar administrador" : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
