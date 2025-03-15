const path = require("path");

const { BrowserWindow, app } = require("electron");

let height;
// windows
if(process.platform === 'win32') {
    height = 640; // have to allocate extra space for bigger top bar (with minimize, close, etc.)
} else {
    height = 620;
}

let mainWindow = new BrowserWindow({
  width: 300,
  // width: 700,
  height,
  alwaysOnTop: true,

  webPreferences: {
    preload: path.join(__dirname, "preload.js"),
  },
});

mainWindow.removeMenu();

// and load the index.html of the app.
mainWindow.loadFile("index.html");

// Open DevTools programmatically
// mainWindow.webContents.openDevTools();

//   // Automatically open Chrome's DevTools in development mode.
//   if (!app.isPackaged) {
//     mainWindow.webContents.openDevTools();
//   }

mainWindow.on("close", (e) => {
  app.quit();
});

module.exports = mainWindow;
