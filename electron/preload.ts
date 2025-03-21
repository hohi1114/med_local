import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  ping: () => "pong",
  getSystemUUID: () => ipcRenderer.invoke("get-system-uuid")
});
