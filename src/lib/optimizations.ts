// Catalog shown in the panel. The actual PowerShell for each id lives ONLY in
// electron/actions.cjs (whitelist) so the remote page can never run arbitrary code.
export type Action = { id: string; title: string; desc: string; tag: string; risky?: boolean };
export type Category = { id: string; title: string; actions: Action[] };

export const CATEGORIES: Category[] = [
  {
    id: "limpeza",
    title: "Limpeza Profunda",
    actions: [
      { id: "clean_temp", tag: "LIMPEZA", title: "Limpar arquivos temporários", desc: "Apaga %TEMP%, Windows\\Temp e arquivos de log antigos." },
      { id: "clean_prefetch", tag: "LIMPEZA", title: "Limpar Prefetch", desc: "Remove o cache de pré-carregamento do Windows." },
      { id: "clean_update", tag: "LIMPEZA", title: "Limpar cache do Windows Update", desc: "Para o serviço, esvazia SoftwareDistribution\\Download e reinicia." },
      { id: "clean_recycle", tag: "LIMPEZA", title: "Esvaziar Lixeira", desc: "Esvazia a lixeira de todas as unidades." },
      { id: "clean_shader", tag: "GPU", title: "Limpar cache de shaders", desc: "Apaga D3DSCache, NVIDIA DXCache/GLCache e AMD DxCache." },
      { id: "clean_thumbs", tag: "LIMPEZA", title: "Limpar cache de miniaturas", desc: "Remove thumbcache e iconcache do Explorer." },
    ],
  },
  {
    id: "memoria",
    title: "Memória RAM",
    actions: [
      { id: "ram_trim", tag: "RAM", title: "Liberar memória (Working Set)", desc: "Força todos os processos a devolver memória não usada ao sistema." },
      { id: "ram_sysmain_off", tag: "RAM", title: "Desativar SysMain (Superfetch)", desc: "Reduz uso de disco/RAM em segundo plano. Ideal para SSD." },
      { id: "ram_sysmain_on", tag: "RAM", title: "Reativar SysMain", desc: "Restaura o serviço SysMain ao padrão." },
    ],
  },
  {
    id: "cpu",
    title: "Otimizar CPU",
    actions: [
      { id: "cpu_ultimate", tag: "ENERGIA", title: "Plano Desempenho Máximo", desc: "Cria e ativa o plano Ultimate Performance do Windows." },
      { id: "cpu_parking", tag: "CPU", title: "Desativar Core Parking", desc: "Mantém todos os núcleos ativos (mínimo de núcleos 100%)." },
      { id: "cpu_priority", tag: "CPU", title: "Prioridade para app em primeiro plano", desc: "Win32PrioritySeparation = 26 (mais fatia de CPU ao jogo)." },
      { id: "cpu_balanced", tag: "ENERGIA", title: "Voltar ao plano Equilibrado", desc: "Restaura o plano de energia padrão." },
    ],
  },
  {
    id: "gpu",
    title: "Otimizar GPU",
    actions: [
      { id: "gpu_hags", tag: "GPU", title: "Agendamento de GPU acelerado", desc: "Ativa Hardware-Accelerated GPU Scheduling (requer reiniciar)." },
      { id: "gpu_priority", tag: "GPU", title: "Prioridade máxima de GPU para jogos", desc: "GPU Priority 8, Priority 6 e Scheduling Category High na tarefa Games." },
      { id: "gpu_dvr_off", tag: "GPU", title: "Desativar Game DVR", desc: "Desliga gravação em segundo plano que consome GPU." },
      { id: "gpu_tdr", tag: "GPU", title: "Aumentar TDR Delay", desc: "Evita travamentos por timeout do driver (TdrDelay = 10)." },
    ],
  },
  {
    id: "windows",
    title: "Otimizar Windows",
    actions: [
      { id: "win_visual", tag: "INTERFACE", title: "Efeitos visuais para desempenho", desc: "Desliga animações e transparências do Windows." },
      { id: "win_telemetry", tag: "PRIVACIDADE", title: "Desativar telemetria", desc: "Desliga DiagTrack, dmwappushservice e coleta de dados." },
      { id: "win_bgapps", tag: "SISTEMA", title: "Bloquear apps em segundo plano", desc: "Impede apps da Store de rodarem escondidos." },
      { id: "win_search_web", tag: "SISTEMA", title: "Desativar busca Bing no Iniciar", desc: "Menu Iniciar mais rápido, sem resultados da web." },
      { id: "win_startup_delay", tag: "INICIALIZAÇÃO", title: "Remover atraso de inicialização", desc: "Programas de inicialização abrem sem espera." },
    ],
  },
  {
    id: "jogos",
    title: "Modo Jogos & FPS",
    actions: [
      { id: "game_mode", tag: "FPS", title: "Ativar Modo de Jogo", desc: "Liga o Game Mode nativo do Windows." },
      { id: "game_network", tag: "FPS", title: "Remover limitação de rede/multimídia", desc: "NetworkThrottlingIndex off e SystemResponsiveness 0." },
      { id: "game_fse", tag: "FPS", title: "Otimizações de tela cheia", desc: "Desativa FSO global para menor input lag." },
      { id: "game_gamebar_off", tag: "FPS", title: "Desativar Xbox Game Bar", desc: "Remove overlay e captura do Game Bar." },
    ],
  },
  {
    id: "rede",
    title: "Rede & DNS",
    actions: [
      { id: "net_flush", tag: "REDE", title: "Renovar DNS e Winsock", desc: "ipconfig /flushdns, reset winsock e IP (requer reiniciar)." },
      { id: "net_cloudflare", tag: "DNS", title: "DNS Cloudflare (1.1.1.1)", desc: "Define DNS rápido em todos os adaptadores ativos." },
      { id: "net_google", tag: "DNS", title: "DNS Google (8.8.8.8)", desc: "Define DNS do Google em todos os adaptadores ativos." },
      { id: "net_nagle", tag: "PING", title: "Desativar algoritmo de Nagle", desc: "TcpAckFrequency e TCPNoDelay = 1 (menor ping)." },
    ],
  },
  {
    id: "mouse",
    title: "Mouse & Teclado",
    actions: [
      { id: "mouse_accel", tag: "MOUSE", title: "Desativar aceleração do mouse", desc: "Mira 1:1 sem 'Aprimorar precisão do ponteiro'." },
      { id: "kb_speed", tag: "TECLADO", title: "Resposta máxima do teclado", desc: "Atraso mínimo e repetição máxima." },
    ],
  },
  {
    id: "ferramentas",
    title: "Ferramentas",
    actions: [
      { id: "tool_restore", tag: "SEGURANÇA", title: "Criar ponto de restauração", desc: "Recomendado antes de aplicar otimizações." },
      { id: "tool_explorer", tag: "EXPLORER", title: "Reiniciar Windows Explorer", desc: "Aplica mudanças de interface sem reiniciar o PC." },
      { id: "tool_sfc", tag: "REPARO", title: "Verificar arquivos do sistema (SFC)", desc: "sfc /scannow — pode levar vários minutos." },
      { id: "tool_dism", tag: "REPARO", title: "Reparar imagem do Windows (DISM)", desc: "DISM /RestoreHealth — pode levar vários minutos." },
      { id: "tool_reboot", tag: "SISTEMA", title: "Reiniciar o computador", desc: "Reinicia em 10 segundos.", risky: true },
    ],
  },
];

export const BOOST_IDS = ["clean_temp", "ram_trim", "net_flush_dns", "cpu_ultimate", "game_mode"];

export type DesktopStats = {
  ramTotal: number; ramFree: number; cpu: number; cpuName: string; threads: number;
  gpuName: string; diskTotal: number; diskFree: number;
};

declare global {
  interface Window {
    scarface?: {
      run: (id: string) => Promise<{ ok: boolean; output: string }>;
      stats: () => Promise<DesktopStats>;
    };
  }
}
