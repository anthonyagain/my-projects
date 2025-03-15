const { contextBridge, ipcRenderer } = require("electron");

/*
This is kind of a weird pattern for communicating. Not 100% sure if it is
required to do it this way, but it might be.

The reason there is this layer at all is because the NodeJS process that has
access to desktop APIs is somehow separate from the DOM/browser stuff, which is
sandboxed.
*/
contextBridge.exposeInMainWorld("electron", {
  startRecordingWindows: (callback) => {
    ipcRenderer.on(":get-active-window", callback);

    return () => {
      ipcRenderer.removeListener(":get-active-window", callback);
    };
  },
  stopRecordingWindows: (callback) => {
    return () => {
      ipcRenderer.removeListener(":get-active-window", callback);
    };
  },
  getWindowData: () => {
    ipcRenderer.send(":give-active-window");
  },
  startRecordingMouse: (callback) => {
    ipcRenderer.send(":start-recording-mouse");
    ipcRenderer.on(":mouse-click", callback);
    return () => {
      ipcRenderer.removeListener(":mouse-click", callback);
    };
  },
  startRecordingKeyboard: (callback) => {
    ipcRenderer.send(":start-recording-keyboard");
    ipcRenderer.on(":keyboard-press", callback);
    return () => {
      ipcRenderer.removeListener(":keyboard-press", callback);
    };
  },
});
