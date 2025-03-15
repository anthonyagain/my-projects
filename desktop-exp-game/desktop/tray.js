const { Tray, Menu, app } = require("electron");

const isDev = require("electron-is-dev");
const path = require("path");

const mainWindow = require("./mainWindow");

//set the icon tray for windows and mac
//for mac should have 2 icons one 16x16 and other 32X32

const iconName =
  process.platform === "win32" ? "windows-icon@2x.png" : "iconTemplate.png";
const iconPath = path.join(__dirname, `./tray-icons/${iconName}`);

//initial the tray
let tray = new Tray(iconPath);

//this toolTip is for when you hover the tray icon will show the title
//I just take the title from index.html
tray.setToolTip("workplus");

//get the tray position in the screen
const { x, y } = tray.getBounds();

//console.log(x,y)

//get the width and the height of the mainWindow
const { width, height } = mainWindow.getBounds();

//set the new position of the mainwindow
//by default mainwindow will show in the center of the screen
//we want to show the screen in the  corner of the screen

const yPosition = process.platform === "darwin" ? y : y - height;
mainWindow.setBounds({
  x:
    process.platform === "darwin"
      ? parseInt(x - width)
      : parseInt(x - width / 2),
  y: yPosition,
  width,
  height,
});

tray.on("click", () => {
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow.show();
  }
});

module.exports = tray;
