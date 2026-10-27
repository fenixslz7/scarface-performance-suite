import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, KeyRound, CalendarPlus } from "lucide-react";
import { createAccount, deleteAccount, listUsers, updateAccount } from "@/lib/accounts.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const toIso = (date: string) => (date ? new Date(date + "T23:59:59").toISOString() : null);

export function AdminUsers() {
  const qc = useQueryClient();
  const list = useServerFn(listUsers);
  const create = useServerFn(createAccount);
  const update = useServerFn(updateAccount);
  const remove = useServerFn(deleteAccount);
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: () => list() });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [days, setDays] = useState("30");
  const refresh = () => qc.invalidateQueries({ queryKey: ["users"] });

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const d = Number(days);
      const expiresAt = d > 0 ? new Date(Date.now() + d * 86400000).toISOString() : null;
      await create({ data: { username, password, expiresAt } });
      toast.success(`Login "${username}" criado`);
      setUsername(""); setPassword("");
      refresh();
    } catch (err) { toast.error((err as Error).message); }
  }

  async function act(fn: () => Promise<unknown>, ok: string) {
    try { await fn(); toast.success(ok); refresh(); } catch (err) { toast.error((err as Error).message); }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl tracking-wider">Gerenciar Logins</h1>
      <form onSubmit={onCreate} className="grid grid-cols-4 items-end gap-3 rounded-xl border bg-card p-5">
        <div className="space-y-1"><Label>Usuário</Label><Input value={username} onChange={(e) => setUsername(e.target.value)} required /></div>
        <div className="space-y-1"><Label>Senha</Label><Input value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        <div className="space-y-1"><Label>Validade (dias, 0 = sem limite)</Label><Input type="number" min={0} value={days} onChange={(e) => setDays(e.target.value)} /></div>
        <Button variant="hero" type="submit">Criar login</Button>
      </form>
      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-muted-foreground">
            <tr><th className="p-3">Usuário</th><th className="p-3">Validade</th><th className="p-3">Status</th><th className="p-3 text-right">Ações</th></tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const expired = !u.isAdmin && u.expires_at && new Date(u.expires_at) < new Date();
              return (
                <tr key={u.id} className="border-t">
                  <td className="p-3 font-bold">{u.username}{u.isAdmin && <span className="ml-2 text-xs text-gold">ADMIN</span>}</td>
                  <td className="p-3">
                    <Input type="date" className="w-40" defaultValue={u.expires_at?.slice(0, 10) ?? ""}
                      onBlur={(e) => e.target.value !== (u.expires_at?.slice(0, 10) ?? "") &&
                        act(() => update({ data: { id: u.id, expiresAt: toIso(e.target.value) } }), "Validade atualizada")} />
                  </td>
                  <td className={expired ? "p-3 text-destructive" : "p-3 text-success"}>{expired ? "Expirado" : "Ativo"}</td>
                  <td className="space-x-1 p-3 text-right">
                    <Button size="sm" variant="ghost" title="+30 dias" onClick={() => {
                      const base = u.expires_at && new Date(u.expires_at) > new Date() ? new Date(u.expires_at) : new Date();
                      act(() => update({ data: { id: u.id, expiresAt: new Date(base.getTime() + 30 * 86400000).toISOString() } }), "+30 dias");
                    }}><CalendarPlus /></Button>
                    <Button size="sm" variant="ghost" title="Trocar senha" onClick={() => {
                      const p = prompt(`Nova senha para ${u.username}:`);
                      if (p) act(() => update({ data: { id: u.id, password: p } }), "Senha alterada");
                    }}><KeyRound /></Button>
                    {!u.isAdmin && (
                      <Button size="sm" variant="ghost" title="Excluir" onClick={() => confirm(`Excluir ${u.username}?`) &&
                        act(() => remove({ data: { id: u.id } }), "Login excluído")}><Trash2 /></Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
