import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Zap, Download, LogOut, Users, Gauge, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getMe } from "@/lib/accounts.functions";
import { BOOST_IDS, CATEGORIES, type Action, type DesktopStats } from "@/lib/optimizations";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Logo } from "@/components/scarface/Logo";
import { Ring } from "@/components/scarface/Ring";
import { AdminUsers } from "@/components/scarface/AdminUsers";
import { cn } from "@/lib/utils";
import appZip from "@/assets/ScarfaceOptimizer-win32-x64.zip.asset.json";

export const Route = createFileRoute("/_authenticated/panel")({
  head: () => ({
    meta: [
      { title: "Painel — SCARFACE OPTIMIZER" },
      { name: "description", content: "Limpeza, RAM, CPU, GPU, rede e modo jogos em um clique." },
      { property: "og:title", content: "Painel — SCARFACE OPTIMIZER" },
      { property: "og:description", content: "Limpeza, RAM, CPU, GPU, rede e modo jogos em um clique." },
    ],
  }),
  component: Panel,
});

type Log = { time: string; text: string; ok: boolean };
const GB = (b: number) => (b / 1024 ** 3).toFixed(1);

function Panel() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const me = useServerFn(getMe);
  const { data: user } = useQuery({ queryKey: ["me"], queryFn: () => me() });
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState<DesktopStats | null>(null);
  const [desktop, setDesktop] = useState(false);
  const [running, setRunning] = useState<string | null>(null);
  const [boost, setBoost] = useState(0);
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    if (!window.scarface) return;
    setDesktop(true);
    const tick = () => window.scarface!.stats().then(setStats).catch(() => {});
    tick();
    const t = setInterval(tick, 2000);
    return () => clearInterval(t);
  }, []);

  const log = (text: string, ok: boolean) =>
    setLogs((l) => [{ time: new Date().toLocaleTimeString("pt-BR"), text, ok }, ...l].slice(0, 200));

  async function run(a: Pick<Action, "id" | "title">) {
    if (!window.scarface) { toast.error("Abra o app desktop SCARFACE OPTIMIZER para aplicar."); return false; }
    setRunning(a.id);
    const r = await window.scarface.run(a.id);
    setRunning(null);
    const msg = r.output.trim().split("\n").slice(-1)[0] || a.title;
    log(`${a.title}: ${msg}`, r.ok);
    r.ok ? toast.success(msg) : toast.error(`Falhou: ${a.title}`);
    return r.ok;
  }

  async function runBoost() {
    if (!window.scarface) { toast.error("Abra o app desktop SCARFACE OPTIMIZER para aplicar."); return; }
    setRunning("boost");
    for (const [i, id] of BOOST_IDS.entries()) {
      const r = await window.scarface.run(id);
      log(`Boost: ${r.output.trim().split("\n").slice(-1)[0]}`, r.ok);
      setBoost(Math.round(((i + 1) / BOOST_IDS.length) * 100));
    }
    setRunning(null);
    toast.success("Sistema otimizado!");
    setTimeout(() => setBoost(0), 3000);
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (user?.expired) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <Logo />
        <h1 className="font-display text-3xl tracking-wider">ACESSO EXPIRADO</h1>
        <p className="text-muted-foreground">Seu plano terminou. Fale com o administrador para renovar.</p>
        <Button variant="outline" onClick={signOut}>Sair</Button>
      </div>
    );
  }

  const nav = [
    { id: "overview", title: "Visão Geral & Boost", icon: Gauge },
    ...CATEGORIES.map((c) => ({ id: c.id, title: c.title, count: c.actions.length })),
    { id: "logs", title: "Console de Logs", icon: ScrollText },
    ...(user?.isAdmin ? [{ id: "admin", title: "Gerenciar Logins", icon: Users }] : []),
  ];
  const category = CATEGORIES.find((c) => c.id === tab);
  const ramPct = stats ? Math.round(((stats.ramTotal - stats.ramFree) / stats.ramTotal) * 100) : 0;
  const diskPct = stats?.diskTotal ? Math.round(((stats.diskTotal - stats.diskFree) / stats.diskTotal) * 100) : 0;

  return (
    <div className="flex h-screen bg-background">
      <aside className="flex w-64 shrink-0 flex-col border-r bg-sidebar">
        <div className="p-5"><Logo /></div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-[15px] font-semibold transition-colors",
                tab === n.id ? "border border-primary/50 bg-sidebar-accent text-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60",
              )}
            >
              {n.title}
              {"count" in n ? (
                <span className="rounded-full bg-muted px-2 text-xs text-muted-foreground">{n.count}</span>
              ) : n.id === "overview" ? (
                <span className="rounded-full border border-primary px-2 text-[10px] text-primary">LIVE</span>
              ) : null}
            </button>
          ))}
        </nav>
        <div className="m-3 flex items-center justify-between rounded-lg border bg-card p-3">
          <div>
            <div className="font-bold uppercase">{user?.username}</div>
            <div className="text-xs text-success">
              ● {user?.isAdmin ? "ADMIN" : "VIP"}
              {user?.expiresAt && ` · até ${new Date(user.expiresAt).toLocaleDateString("pt-BR")}`}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}><LogOut />Sair</Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        {!desktop && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-gold/40 bg-accent p-4">
            <p className="text-sm">
              Você está no navegador. Para otimizar o PC de verdade, use o <b>app desktop para Windows</b>.
            </p>
            <Button variant="hero" size="sm" asChild>
              <a href={appZip.url} download="ScarfaceOptimizer-win32-x64.zip"><Download />Baixar</a>
            </Button>
          </div>
        )}

        {tab === "overview" && (
          <div className="space-y-6">
            <header>
              <h1 className="font-display text-4xl tracking-wider">Painel de Desempenho</h1>
              <p className="text-muted-foreground">Monitore recursos em tempo real e acelere o sistema com 1 clique.</p>
            </header>
            <div className="grid grid-cols-3 gap-4">
              <Ring value={ramPct} label="MEMÓRIA RAM" sub={stats ? `${GB(stats.ramTotal - stats.ramFree)} GB / ${GB(stats.ramTotal)} GB` : "—"} tone="primary" />
              <Ring value={stats?.cpu ?? 0} label="PROCESSADOR CPU" sub={stats ? `${stats.threads} THREADS LÓGICAS` : "—"} tone="gold" />
              <Ring value={diskPct} label="DISCO LOCAL C:" sub={stats ? `${GB(stats.diskFree)} GB livres de ${GB(stats.diskTotal)} GB` : "—"} tone="success" />
            </div>
            <section className="rounded-xl border bg-card p-6">
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-primary px-3 py-0.5 text-xs font-bold text-primary">ULTRA BOOST</span>
                <h2 className="font-display text-2xl tracking-wider">ACELERAÇÃO TOTAL DO SISTEMA (1-CLIQUE)</h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Limpa temporários, libera RAM, renova DNS, ativa Desempenho Máximo e Modo de Jogo.
              </p>
              <Progress value={boost} className="mt-5 h-2" />
              <div className="mt-4 flex items-center justify-between">
                <span className={cn("font-semibold", running === "boost" ? "text-gold" : "text-success")}>
                  {running === "boost" ? `Otimizando... ${boost}%` : "Sistema pronto"}
                </span>
                <Button variant="hero" size="lg" className="h-12" onClick={runBoost} disabled={!!running}>
                  <Zap />Otimizar agora
                </Button>
              </div>
            </section>
            <div className="grid grid-cols-2 gap-3">
              <Spec tag="CPU" value={stats?.cpuName} />
              <Spec tag="GPU" value={stats?.gpuName} />
              <Spec tag="RAM" value={stats && `${Math.round(stats.ramTotal / 1024 ** 2)} MB total // ${Math.round(stats.ramFree / 1024 ** 2)} MB livres`} />
              <Spec tag="DISCO C" value={stats && `${GB(stats.diskTotal)} GB total // ${GB(stats.diskFree)} GB livres`} />
            </div>
            <h3 className="border-l-4 border-primary pl-3 font-display text-xl tracking-wider">Ações rápidas</h3>
            <ActionGrid actions={CATEGORIES.find((c) => c.id === "ferramentas")!.actions.slice(0, 2)} running={running} onRun={run} />
          </div>
        )}

        {category && (
          <div className="space-y-6">
            <h1 className="font-display text-4xl tracking-wider">{category.title}</h1>
            <ActionGrid actions={category.actions} running={running} onRun={run} />
          </div>
        )}

        {tab === "logs" && (
          <div className="space-y-4">
            <h1 className="font-display text-4xl tracking-wider">Console de Logs</h1>
            <div className="min-h-64 rounded-xl border bg-card p-4 font-mono text-sm">
              {logs.length === 0 && <p className="text-muted-foreground">Nenhuma ação executada ainda.</p>}
              {logs.map((l, i) => (
                <div key={i} className={l.ok ? "text-foreground" : "text-destructive"}>
                  <span className="text-muted-foreground">[{l.time}]</span> {l.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "admin" && user?.isAdmin && <AdminUsers />}
      </main>
    </div>
  );
}

function Spec({ tag, value }: { tag: string; value?: string | null | undefined }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
      <span className="rounded-full border border-primary/60 px-3 text-xs font-bold text-primary">{tag}</span>
      <span className="truncate font-semibold">{value || "—"}</span>
    </div>
  );
}

function ActionGrid({ actions, running, onRun }: { actions: Action[]; running: string | null; onRun: (a: Action) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {actions.map((a) => (
        <div key={a.id} className="flex flex-col justify-between gap-4 rounded-xl border bg-card p-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-gold/60 px-2 text-[11px] font-bold text-gold">{a.tag}</span>
              <h3 className="text-lg font-bold">{a.title}</h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{a.desc}</p>
          </div>
          <Button
            variant="hero"
            className="self-end"
            disabled={!!running}
            onClick={() => (!a.risky || confirm(`Confirmar: ${a.title}?`)) && onRun(a)}
          >
            {running === a.id ? "Aplicando..." : "Aplicar"}
          </Button>
        </div>
      ))}
    </div>
  );
}
