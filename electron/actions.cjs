// Whitelisted PowerShell scripts. Only these ids can be executed by the panel.
const REG = (path, name, value, type = "DWord") =>
  `New-Item -Path '${path}' -Force | Out-Null; Set-ItemProperty -Path '${path}' -Name '${name}' -Value ${value} -Type ${type} -Force`;

const GAMES = "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games";
const PROFILE = "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile";

const TRIM = `
Add-Type @"
using System; using System.Runtime.InteropServices;
public class Mem { [DllImport("psapi.dll")] public static extern bool EmptyWorkingSet(IntPtr h); }
"@
$n=0; Get-Process | ForEach-Object { try { if ([Mem]::EmptyWorkingSet($_.Handle)) { $n++ } } catch {} }
"Memória liberada de $n processos"`;

module.exports = {
  clean_temp: `Remove-Item "$env:TEMP\\*" -Recurse -Force -ErrorAction SilentlyContinue; Remove-Item "$env:WINDIR\\Temp\\*" -Recurse -Force -ErrorAction SilentlyContinue; Remove-Item "$env:WINDIR\\Logs\\CBS\\*.log" -Force -ErrorAction SilentlyContinue; "Temporários limpos"`,
  clean_prefetch: `Remove-Item "$env:WINDIR\\Prefetch\\*" -Force -ErrorAction SilentlyContinue; "Prefetch limpo"`,
  clean_update: `Stop-Service wuauserv,bits -Force -ErrorAction SilentlyContinue; Remove-Item "$env:WINDIR\\SoftwareDistribution\\Download\\*" -Recurse -Force -ErrorAction SilentlyContinue; Start-Service wuauserv,bits -ErrorAction SilentlyContinue; "Cache do Windows Update limpo"`,
  clean_recycle: `Clear-RecycleBin -Force -ErrorAction SilentlyContinue; "Lixeira esvaziada"`,
  clean_shader: `@("$env:LOCALAPPDATA\\D3DSCache","$env:LOCALAPPDATA\\NVIDIA\\DXCache","$env:LOCALAPPDATA\\NVIDIA\\GLCache","$env:LOCALAPPDATA\\AMD\\DxCache","$env:LOCALAPPDATA\\AMD\\GLCache") | ForEach-Object { Remove-Item "$_\\*" -Recurse -Force -ErrorAction SilentlyContinue }; "Cache de shaders limpo"`,
  clean_thumbs: `Stop-Process -Name explorer -Force; Remove-Item "$env:LOCALAPPDATA\\Microsoft\\Windows\\Explorer\\thumbcache_*.db","$env:LOCALAPPDATA\\Microsoft\\Windows\\Explorer\\iconcache_*.db" -Force -ErrorAction SilentlyContinue; Start-Process explorer; "Miniaturas limpas"`,

  ram_trim: TRIM,
  ram_sysmain_off: `Stop-Service SysMain -Force -ErrorAction SilentlyContinue; Set-Service SysMain -StartupType Disabled; "SysMain desativado"`,
  ram_sysmain_on: `Set-Service SysMain -StartupType Automatic; Start-Service SysMain -ErrorAction SilentlyContinue; "SysMain reativado"`,

  cpu_ultimate: `$o = powercfg -duplicatescheme e9a42b02-d5df-448d-aa00-03f14749eb61; $g = ([regex]'[0-9a-f-]{36}').Match($o).Value; if ($g) { powercfg -setactive $g; "Plano Desempenho Máximo ativado" } else { powercfg -setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c; "Plano Alto Desempenho ativado" }`,
  cpu_parking: `powercfg -setacvalueindex scheme_current sub_processor CPMINCORES 100; powercfg -setactive scheme_current; "Core parking desativado"`,
  cpu_priority: `${REG("HKLM:\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl", "Win32PrioritySeparation", 38)}; "Prioridade de primeiro plano aplicada"`,
  cpu_balanced: `powercfg -setactive 381b4222-f694-41f0-9685-ff5bb260df2e; "Plano Equilibrado ativado"`,

  gpu_hags: `${REG("HKLM:\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers", "HwSchMode", 2)}; "HAGS ativado — reinicie o PC"`,
  gpu_priority: `${REG(GAMES, "GPU Priority", 8)}; ${REG(GAMES, "Priority", 6)}; ${REG(GAMES, "Scheduling Category", "'High'", "String")}; ${REG(GAMES, "SFIO Priority", "'High'", "String")}; "Prioridade de GPU aplicada"`,
  gpu_dvr_off: `${REG("HKCU:\\System\\GameConfigStore", "GameDVR_Enabled", 0)}; ${REG("HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\GameDVR", "AllowGameDVR", 0)}; "Game DVR desativado"`,
  gpu_tdr: `${REG("HKLM:\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers", "TdrDelay", 10)}; "TDR Delay = 10s"`,

  win_visual: `${REG("HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects", "VisualFXSetting", 2)}; ${REG("HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize", "EnableTransparency", 0)}; ${REG("HKCU:\\Control Panel\\Desktop\\WindowMetrics", "MinAnimate", "'0'", "String")}; "Efeitos visuais otimizados (reinicie o Explorer)"`,
  win_telemetry: `${REG("HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection", "AllowTelemetry", 0)}; foreach ($s in 'DiagTrack','dmwappushservice') { Stop-Service $s -Force -ErrorAction SilentlyContinue; Set-Service $s -StartupType Disabled -ErrorAction SilentlyContinue }; "Telemetria desativada"`,
  win_bgapps: `${REG("HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications", "GlobalUserDisabled", 1)}; ${REG("HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\AppPrivacy", "LetAppsRunInBackground", 2)}; "Apps em segundo plano bloqueados"`,
  win_search_web: `${REG("HKCU:\\Software\\Policies\\Microsoft\\Windows\\Explorer", "DisableSearchBoxSuggestions", 1)}; ${REG("HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Search", "BingSearchEnabled", 0)}; "Busca web desativada"`,
  win_startup_delay: `${REG("HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Serialize", "StartupDelayInMSec", 0)}; "Atraso de inicialização removido"`,

  game_mode: `${REG("HKCU:\\Software\\Microsoft\\GameBar", "AllowAutoGameMode", 1)}; ${REG("HKCU:\\Software\\Microsoft\\GameBar", "AutoGameModeEnabled", 1)}; "Modo de Jogo ativado"`,
  game_network: `${REG(PROFILE, "NetworkThrottlingIndex", "0xffffffff")}; ${REG(PROFILE, "SystemResponsiveness", 0)}; "Limitações removidas"`,
  game_fse: `${REG("HKCU:\\System\\GameConfigStore", "GameDVR_FSEBehaviorMode", 2)}; ${REG("HKCU:\\System\\GameConfigStore", "GameDVR_HonorUserFSEBehaviorMode", 1)}; ${REG("HKCU:\\System\\GameConfigStore", "GameDVR_DXGIHonorFSEWindowsCompatible", 1)}; "Otimizações de tela cheia aplicadas"`,
  game_gamebar_off: `${REG("HKCU:\\Software\\Microsoft\\GameBar", "UseNexusForGameBarEnabled", 0)}; ${REG("HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR", "AppCaptureEnabled", 0)}; "Xbox Game Bar desativada"`,

  net_flush_dns: `ipconfig /flushdns | Out-Null; "DNS renovado"`,
  net_flush: `ipconfig /flushdns | Out-Null; netsh winsock reset | Out-Null; netsh int ip reset | Out-Null; "Rede resetada — reinicie o PC"`,
  net_cloudflare: `Get-NetAdapter | Where-Object Status -eq 'Up' | ForEach-Object { Set-DnsClientServerAddress -InterfaceIndex $_.ifIndex -ServerAddresses 1.1.1.1,1.0.0.1 }; ipconfig /flushdns | Out-Null; "DNS Cloudflare aplicado"`,
  net_google: `Get-NetAdapter | Where-Object Status -eq 'Up' | ForEach-Object { Set-DnsClientServerAddress -InterfaceIndex $_.ifIndex -ServerAddresses 8.8.8.8,8.8.4.4 }; ipconfig /flushdns | Out-Null; "DNS Google aplicado"`,
  net_nagle: `Get-ChildItem 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces' | ForEach-Object { Set-ItemProperty -Path $_.PSPath -Name TcpAckFrequency -Value 1 -Type DWord -Force; Set-ItemProperty -Path $_.PSPath -Name TCPNoDelay -Value 1 -Type DWord -Force }; "Nagle desativado"`,

  mouse_accel: `${REG("HKCU:\\Control Panel\\Mouse", "MouseSpeed", "'0'", "String")}; ${REG("HKCU:\\Control Panel\\Mouse", "MouseThreshold1", "'0'", "String")}; ${REG("HKCU:\\Control Panel\\Mouse", "MouseThreshold2", "'0'", "String")}; "Aceleração desativada (faça logoff)"`,
  kb_speed: `${REG("HKCU:\\Control Panel\\Keyboard", "KeyboardDelay", "'0'", "String")}; ${REG("HKCU:\\Control Panel\\Keyboard", "KeyboardSpeed", "'31'", "String")}; "Teclado otimizado"`,

  tool_restore: `Enable-ComputerRestore -Drive "$env:SystemDrive\\"; ${REG("HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\SystemRestore", "SystemRestorePointCreationFrequency", 0)}; Checkpoint-Computer -Description "Scarface Optimizer" -RestorePointType MODIFY_SETTINGS; "Ponto de restauração criado"`,
  tool_explorer: `Stop-Process -Name explorer -Force; Start-Sleep 1; Start-Process explorer; "Explorer reiniciado"`,
  tool_sfc: `sfc /scannow`,
  tool_dism: `DISM /Online /Cleanup-Image /RestoreHealth`,
  tool_reboot: `shutdown /r /t 10; "Reiniciando em 10 segundos"`,
};
