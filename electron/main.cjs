const { app, BrowserWindow, ipcMain } = require("electron");
const { execFile } = require("child_process");
const path = require("path");
const os = require("os");
const ACTIONS = require("./actions.cjs");

const PANEL_URL = "https://game-ready-system-suite.lovable.app/panel";

function ps(script, timeout = 15 * 60 * 1000) {
  return new Promise((resolve) => {
    execFile(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command",
       "[Console]::OutputEncoding=[Text.Encoding]::UTF8; " + script],
      { windowsHide: true, timeout, maxBuffer: 10 * 1024 * 1024 },
      (err, stdout, stderr) => resolve({ ok: !err, output: (stdout || "") + (stderr || "") + (err && !stdout ? String(err.message) : "") }),
    );
  });
}

function cpuSnapshot() {
  return os.cpus().reduce((a, c) => {
    const t = Object.values(c.times).reduce((x, y) => x + y, 0);
    return { idle: a.idle + c.times.idle, total: a.total + t };
  }, { idle: 0, total: 0 });
}
let last = cpuSnapshot();
let hw = null;
let disk = { total: 0, free: 0, at: 0 };

async function loadHw() {
  if (hw) return hw;
  const r = await ps("(Get-CimInstance Win32_VideoController | Select-Object -First 1 -ExpandProperty Name)", 20000);
  hw = { gpuName: r.output.trim() || "GPU" };
  return hw;
}
async function loadDisk() {
  if (Date.now() - disk.at < 15000) return disk;
  const r = await ps("$d=Get-PSDrive C; \"$($d.Used+$d.Free)|$($d.Free)\"", 20000);
  const [t, f] = r.output.trim().split("|").map(Number);
  disk = { total: t || 0, free: f || 0, at: Date.now() };
  return disk;
}

ipcMain.handle("scarface:run", async (_e, id) => {
  const script = ACTIONS[id];
  if (typeof id !== "string" || !script) return { ok: false, output: "Ação desconhecida" };
  return ps(script);
});

ipcMain.handle("scarface:stats", async () => {
  const now = cpuSnapshot();
  const idle = now.idle - last.idle, total = now.total - last.total;
  last = now;
  const [h, d] = await Promise.all([loadHw(), loadDisk()]);
  const cpus = os.cpus();
  return {
    ramTotal: os.totalmem(), ramFree: os.freemem(),
    cpu: total > 0 ? Math.round((1 - idle / total) * 100) : 0,
    cpuName: cpus[0] ? cpus[0].model.trim() : "CPU", threads: cpus.length,
    gpuName: h.gpuName, diskTotal: d.total, diskFree: d.free,
  };
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 820, minWidth: 1100, minHeight: 700,
    backgroundColor: "#1a0f0f", title: "SCARFACE OPTIMIZER", autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, "preload.cjs"), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  win.loadURL(PANEL_URL);
  // Never let the window navigate away from the panel origin.
  const origin = new URL(PANEL_URL).origin;
  win.webContents.on("will-navigate", (e, url) => { if (new URL(url).origin !== origin) e.preventDefault(); });
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
}

// Relaunch elevated so registry/service tweaks work.
function ensureAdmin() {
  return new Promise((resolve) => {
    execFile("net", ["session"], { windowsHide: true }, (err) => {
      if (!err) return resolve(true);
      execFile("powershell.exe", ["-NoProfile", "-Command", `Start-Process -FilePath '${process.execPath}' -Verb RunAs`], { windowsHide: true }, () => {});
      resolve(false);
    });
  });
}

app.whenReady().then(async () => {
  if (process.platform === "win32" && !(await ensureAdmin())) return app.quit();
  createWindow();
});
app.on("window-all-closed", () => app.quit());
