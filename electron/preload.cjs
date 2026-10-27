const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("scarface", {
  run: (id) => ipcRenderer.invoke("scarface:run", String(id)),
  stats: () => ipcRenderer.invoke("scarface:stats"),
});
