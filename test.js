// WebSocket testing template for 4 users on hoppscotch-like server

const WS_URL = "ws://localhost:8080/";
const ROOM_ID = "room1";

function createUser(userId, name) {
  const ws = new WebSocket(WS_URL, "echo-protocol");

  ws.onopen = () => {
    console.log(`${name} connected`);

    // Send JOIN_ROOM message
    ws.send(JSON.stringify({
      type: "JOIN_ROOM",
      payload: { userId, name, roomId: ROOM_ID }
    }));

    // Send a chat message after joining
    setTimeout(() => {
      ws.send(JSON.stringify({
        type: "SEND_MESSAGE",
        payload: {
          userId,
          roomId: ROOM_ID,
          message: `Hello from ${name}`
        }
      }));
    }, 1000);
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log(`${name} received: `, data);

    // Automatically upvote the first message received from others
    if (data.type === "ADD_CHAT" && data.payload.name !== name) {
      setTimeout(() => {
        ws.send(JSON.stringify({
          type: "UPVOTE_MESSAGE",
          payload: {
            userId,
            roomId: ROOM_ID,
            chatId: data.payload.chatId
          }
        }));
      }, 1000);
    }
  };

  ws.onclose = () => {
    console.log(`${name} disconnected`);
  };

  ws.onerror = (err) => {
    console.error(`${name} error: `, err);
  };

  return ws;
}

// Creating 4 users: Alice, Bob, Carol, Dave
const users = [
  createUser("user1", "Alice"),
  createUser("user2", "Bob"),
  createUser("user3", "Carol"),
  createUser("user4", "Dave")
];
