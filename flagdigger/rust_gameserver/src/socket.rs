use futures::prelude::*; // "turn on" futures from the std library

use crate::events::WebSocketEvent;
use crate::room;
use crate::room::{SocketReader, SocketWriter};
use crate::events;

use serde_json::Value;

use async_std::sync::{Sender, Receiver};
use async_std::net::{TcpListener, TcpStream};
use async_std::task;

use async_tungstenite::{accept_async, tungstenite::Message, tungstenite::Error, WebSocketStream}; // async_tungstenite is like a sub-library within the async_std ecosystem


pub async fn websocket_listen(event_channel_sender: Sender<WebSocketEvent>) {
    /*
    Listen for incoming websocket connections. Whenever a new websocket connection is received,
    spawn a new async_std task for it that runs an instance of the handle_websocket method.

    async_std doesn't use os-level threads for everything, but isn't a pure NodeJS-esque event
    loop either - it looks like it uses some kind of algorithm to decide whether to share CPU
    time between tasks on a single os-level thread, or to split them up among multiple os-level
    threads. You have to write your code assuming that each task could be running on it's own
    os thread.
    */
    let url = "127.0.0.1:5000";

    let url_listener = TcpListener::bind(url).await.expect("Failed to bind");
    println!("Listening on: {}", url);

    while let Ok((tcp_stream, _)) = url_listener.accept().await {
        if let Ok(ws_stream) = accept_async(tcp_stream).await {
            handle_websocket_connection(ws_stream, event_channel_sender.clone()).await;
        } else {
            println!("Error during the websocket handshake occurred");
        }
    }
}

async fn handle_websocket_connection(ws_stream: WebSocketStream<TcpStream>, event_channel_sender: Sender<WebSocketEvent>) {
    /*
    A new websocket connection has been made; meaning a new player intends to join the room.

    Add the player's 'write' socket connection to the Room object and create their player. Spawn
    a new thread/task for handing incoming 'read' events from the socket (player inputs).
    */
    println!("Got a new websocket connection!");
    let (socket_write, socket_read) = ws_stream.split();

    let player_event = WebSocketEvent::new_player(String::from("Peter"), socket_write);

    let session_id = if let WebSocketEvent::Client(ref client_event) = player_event {
        client_event.session_id.clone()
    } else {
        unreachable!();
    };

    event_channel_sender.send(player_event).await;

    task::spawn(async move {
        parse_and_enqueue_socket_events(socket_read, session_id, event_channel_sender).await;
    });
}

async fn parse_and_enqueue_socket_events(socket_read: SocketReader, session_id: String, event_channel_sender: Sender<WebSocketEvent>) {
    /*
    'async_tungstenite' documentation is garbage & incorrect, this is the only way we've figured
    out so far to handle socket_read events using that library.

    Parses incoming socket events into JSON and then into structured data, then sends that data
    over a channel back to the main game loop to be handled during frame downtime.
    */
    fn parse_message(message: Result<Message, Error>) -> Option<Value> {
        let message_result: Value = message.ok().and_then(|val| {
            val.into_text().ok()
        }).and_then(|val| {
            let val2: Option<Value> = serde_json::from_str(val.as_str()).ok();
            val2
        }).ok_or_else(|| eprintln!("ERROR: Failed to parse incoming websocket event.")).ok()?;

        return Some(message_result);
    }

    socket_read.for_each(|item| {
        // TODO, can we remove this task::block_on and just await on the send directly?
        task::block_on(async {
            if let Some(message) = parse_message(item) {
                if let Some(event) = events::deserialize_socket_event(message, &session_id) {
                    event_channel_sender.send(event).await;
                }
            }
        });
        future::ready(())
    }).await;
}
