const fileIcon = require("extract-file-icon");
const activeWindow = require("active-win");

const Jimp = require("jimp");

const fs = require("fs");
const path = require("path");

const io = require("socket.io-client");
const { ipcMain } = require("electron");

const socket = io("http://localhost:3000");

const mainWindow = require("./mainWindow");

ipcMain.on(":give-active-window", () => {
  (async () => {
    Promise.all([activeWindow(), activeWindow.getOpenWindows()])
      .then(([_activeWindow, allWindows]) => {

        if (!_activeWindow) return;
        if (!allWindows) return;

        const getWindowData = w => {
          return {
            filename: w.owner.name.split(".")[0],
            title: w.title
          };
        };

        const windows = allWindows.map(getWindowData);
        const activeWindow = getWindowData(_activeWindow);

        const data = {
          activeWindow,
          windows
        };

        mainWindow.webContents.send(":get-active-window", data);
      })
      .catch((err) => {
        console.log(err);
      });
  })();
});
