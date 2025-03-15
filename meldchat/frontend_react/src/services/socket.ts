import { Socket } from "phoenix";

// Create socket connection
let socket = new Socket("ws://localhost:4000/user-socket", {params: {}})
socket.connect()

// Join the ping channel
let channel = socket.channel("ping", {})
channel.join()
  .receive("ok", resp => { console.log("Joined ping channel successfully", resp) })
  .receive("error", resp => { console.log("Unable to join ping channel", resp) })

// Function to send ping
function sendPing() {
  channel.push("ping", {})
    .receive("ok", resp => console.log("Received pong:", resp.message))
}

// Make sendPing available globally for testing in console
window.sendPing = sendPing
