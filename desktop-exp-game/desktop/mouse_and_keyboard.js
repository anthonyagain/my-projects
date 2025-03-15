const ioHook = require("@spacek33z/iohook");
const { ipcMain } = require("electron");
const mainWindow = require("./mainWindow");

ipcMain.on(":start-recording-mouse", () => {
  console.log(
    "===========================start-recording-mouse=============================",
  );

  ioHook.on("mouseclick", () => {
    mainWindow.webContents.send(":mouse-click");
  });
  ioHook.on("mousemove", () => {});
  ioHook.on("mousedrag", () => {});
  ioHook.on("mousewheel", () => {});
});

ipcMain.on(":start-recording-keyboard", () => {
  console.log(
    "===========================start-recording-keyboard=============================",
  );

  ioHook.on("keydown", () => {
    mainWindow.webContents.send(":keyboard-press");
  });

  ioHook.on("keyup", () => {});

  ioHook.start();
});
