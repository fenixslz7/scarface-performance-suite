import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/panel" });
  },
  head: () => ({
    meta: [
      { title: "SCARFACE OPTIMIZER" },
      { name: "description", content: "Painel de otimização de desempenho para Windows e jogos." },
      { property: "og:title", content: "SCARFACE OPTIMIZER" },
      { property: "og:description", content: "Painel de otimização de desempenho para Windows e jogos." },
    ],
  }),
});
