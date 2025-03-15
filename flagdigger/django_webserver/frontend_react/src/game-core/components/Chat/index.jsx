import React, { useState, useEffect } from 'react';
import './chat.css';
import { useRef } from 'react';
import { LockOpen, Lock, CompressArrows, ExpandArrows } from '../FontIcons/Icons';

const Chat = ({ gameState, socket }) => {

  // Refs
  const chatContentEnd = useRef(null);
  const chatRef = useRef(null);

  // States
  const [inputState, setInputState] = useState({
    value: '',
    showInvalid: false
  });

  const [messages, setMessage] = useState([{
    message: "[System] Welcome on board",
    type: "SYSTEM",
    color: 'rgb(221, 221, 0)'
  }]);

  const [activeChat, setActiveChat] = useState(false); // Just make it not opacity on receiving messages

  const [locked, setLocked] = useState(true); // Locking the chat to prevent moving by holding mouse

  const [minimized, setMinimize] = useState(false);

  const [coords, setCoords] = useState({
    x: "10px",
    y: "50%",
  });


  // React Hooks
  useEffect(() => {
    if (gameState && gameState.chat && gameState.chat.messages && gameState.chat.messages.length >= 1) {
      setMessage([...messages, ...gameState.chat.messages]);
      setActiveChat(true);
      setTimeout(() => setActiveChat(false), 4000); // Make transparent after 4 seconds after receiving messages
    }
  }, [gameState && gameState.chat && gameState.chat.messages]);

  useEffect(() => {
    if (chatContentEnd && chatContentEnd.current) {
      chatContentEnd.current.scrollIntoView({ behavior: 'smooth', block: "end", inline: "nearest" });
    };
  }, [messages]);

  if (!gameState)
    return null;

  const sendMessage = () => {
    if (inputState.value.length >= 3) {
      socket.send(JSON.stringify({ "eventName": "CHAT_MESSAGE", "message": inputState.value, time: +Date.now() }));
      setInputState({ ...inputState, value: '', showInvalid: false });
    } else {
      setInputState({ ...inputState, showInvalid: true });
    }
  };

  // Drag constants and methods goes there
  let lastCheckMove = +new Date();

  const placeHolder = document.createElement("div");
  placeHolder.style.visibility = "hidden";

  const getCoordsInBounds = (event) => { // TODO: Improve the behavior to prevent center the chat of cursor and position by the cursor
    let x = event.clientX - event.target.offsetLeft - (chatRef.current.offsetWidth / 2);
    x = Math.max(x, 0);
    if (x + chatRef.current.offsetWidth >= document.body.clientWidth) {
      x = document.body.clientWidth - chatRef.current.offsetWidth;
    }

    let y = event.clientY - event.target.offsetTop - 10;
    y = Math.max(y, 0);
    if (y + chatRef.current.offsetHeight >= document.body.clientHeight) {
      y = document.body.clientHeight - chatRef.current.offsetHeight;
    }

    return { x, y };
  }

  const handleDrag = (event) => {
    if (locked || !chatRef) return;


    if (+new Date() - lastCheckMove > 16) { // Throttling to increase performance. Otherwise it makes slowly
      lastCheckMove = +new Date();
      let { x, y } = getCoordsInBounds(event);

      if (coords.x !== x || coords.y !== y) { // Decrease the amount of unnecessary rerenders
        setCoords({ x: x, y: y });
      }
    }

  }

  return (
    <div className={`chat${activeChat ? ' chat-is-active' : ''}${minimized ? ' chat-minimized' : ''}`} tabIndex="1"
      style={{ top: coords.y, left: coords.x }}
      ref={chatRef}>
      <div className={`chat-title ${!locked ? 'chat-title-unlocked' : ''}`}
        onDrag={handleDrag}
        onDragStart={(event) => event.dataTransfer.setDragImage(placeHolder, 0, 0)}
        draggable={!locked ? "true" : "false"}
      >

        <div className="chat-tabs">
          <div className="chat-tab">
            Chat
        </div>
        </div>

        <div className="chat-controls">
          <div className="chat-controls-minimize">
            <CompressArrows
              height="15px"
              width="15px"
              onClick={() => setMinimize(true)}
              className={`chat-controls-minimize-button ${!minimized ? 'is-active' : ''}`} />
            <ExpandArrows
              height="15px"
              width="15px"
              onClick={() => setMinimize(false)}
              className={`chat-controls-minimize-button ${minimized ? 'is-active' : ''}`} />
          </div>
          <div className="chat-controls-lock">
            <LockOpen height="14px"
              className={`chat-controls-lock-button chat-controls-lock-open ${!locked ? 'is-active' : ''}`}
              onClick={() => setLocked(true)} width="15px" />
            <Lock height="14px"
              className={`chat-controls-lock-button chat-controls-lock-close ${locked ? 'is-active' : ''}`}
              onClick={() => setLocked(false)} width="15px" />
          </div>
        </div>

      </div>
      <div className="chat-content-wrapper">

        <div className="chat-content" >
          {messages.map((item, index) => <div key={index} className="chat-content-item" style={{ color: item.color }}>
            {item.type === "SYSTEM" ? item.message :
              <>
                {/* <span className="chat-content-item-time">
                {item.time}
              </span> */}
                <span className="chat-content-item-name">
                  {item.name}:
              </span>
                <span>
                  {item.message}
                </span>
              </>
            }
          </div>)}
          <div ref={chatContentEnd}></div>

        </div>

        <div className="chat-input">
          <input type="text"
            className={`chat-input-control ${inputState.showInvalid ? 'chat-input-control-alert' : ''}`}
            value={inputState.value}
            onKeyDown={e => {
              e.stopPropagation();
              const keyCode = e.keyCode || e.charCode;
              if (keyCode === 13) {
                sendMessage();
              }
            }}
            onKeyUp={e => e.stopPropagation()}
            onChange={(e) => {
              setInputState({ ...inputState, value: e.target.value });
            }} />
          <button className="chat-input-submit" onClick={() => sendMessage()}>Send</button>
        </div>

      </div>
    </div >
  )
}

export default Chat;
