import { useEffect, useState } from 'react';

let ROOT: string;
let DEV_MODE: Boolean;
if(process.env.NODE_ENV === "development") {
  ROOT = "localhost:8000"
  DEV_MODE = true;
} else {
  ROOT = window.location.host
}

const debugFPS = () => {
  window.serverFPS = 0;
  window.frontendFPS = 0;
  window.serverFrameCount = 0;
  window.frontendFrameCount = 0;
  window.ping = 0;

  setInterval(() => {
    window.serverFPS = window.serverFrameCount;
    window.frontendFPS = window.frontendFrameCount;
    window.serverFrameCount = 0;
    window.frontendFrameCount = 0;
    window.ping = Math.max(...window.pings);
    window.pings = [];
  }, 1000);
}

export const framesToSeconds = (frames: number) => {
  // TODO: ????
  return ((frames % 60000) / 1000).toFixed(2);
}

const openSocket = (url: string): Promise<WebSocket> => {
  return new Promise(function (resolve, reject) {
    let socket = new WebSocket(url);
    socket.onopen = function () {
      resolve(socket);
    };
    socket.onerror = function (err) {
      reject(err);
    };
  });
}

const useSocket = (socketURL: string) => {
  /*
  Custom hook. Accepts a socket URL. Runs a 'useEffect' that asychronously opens
  a socket connection on that URL. Returns 'null' until the connection is made,
  and then triggers a re-render and returns the socket object in the new render.
  When the component gets unmounted, correctly cleans up the socket object.
  */
  const [[isOpen, socket], setIsSocketOpen] = useState<[boolean, WebSocket | null]>([false, null]);

  useEffect(() => {
    openSocket(socketURL).then((openedSocket) => {
      setIsSocketOpen([true, openedSocket]);
    }).catch((error) => {
      if (!DEV_MODE) alert("Sorry, an error occurred when trying to open a socket connection to the server.");
    });

    return () => {
      if (socket) {
        socket.onmessage = null;
        socket.onclose = null;
        socket.close();
      }
    }
    // technically this has a dependency on socketURL, but this should never change
  }, [socketURL]);

  return socket;
}


export { ROOT, DEV_MODE, debugFPS, useSocket }
