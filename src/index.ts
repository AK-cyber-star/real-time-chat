import {server as WebSocketServer , connection} from "websocket"
import http from "http";
import { IncommingMessage, SupportedMessage } from "./messages/incommingMessages";
import { UserManager } from "./UserManager";
import { InMemoryStore } from "./store/InMemoryStore";
import { OutgoingMessage, OutgoingSupportedMessages } from "./messages/outgoingMessages";

const server = http.createServer(function (req: any, res: any){
    console.log(new Date() +  " Received request for ", req.url);
    res.writeHeader(404);
    res.end();
});

const userManager = new UserManager();
const store = new InMemoryStore();

server.listen(8080, () => console.log(new Date() +  " Server is listening on port: 8080"))

const wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

// todo: fix the origin logic
function originIsAllowed(origin: string): boolean {
    const allowedOrigin = "https://hoppscotch.io"
    return allowedOrigin ===  origin;
}

wsServer.on("request", function (request) {
    console.log("Inside connect!");
    console.log("Request origin: " + request.origin)

    if (!originIsAllowed(request.origin)){
        // Make sure we only accept request from allowed origins
        request.reject();
        console.log(new Date() + " Connection from origin " + request.origin + " rejected!");
        return;
    }
    
    try {
    var connection = request.accept("echo-protocol", request.origin);
    console.log(new Date() + " Connection accepted.")

    connection.on("message", function (message) {
        // Todo handle the message and add rate limiter
        if (message.type === "utf8") {
            try {
                // message handler
                messageHandler(connection, JSON.parse(message.utf8Data));
            } catch (e: any) {
                console.error("Error on accessing message handler " + e.message);
            }
        }
    })

    } catch (e: any) {
        console.error("Invalid request: ", e.message);
    }
})

function messageHandler(ws: connection, message: IncommingMessage) {
    if (message.type === SupportedMessage.JoinRoom) {
        const payload = message.payload
        userManager.addUser(payload.name, payload.userId, payload.roomId, ws);
    }

    if (message.type === SupportedMessage.SendMessage) {
        const payload = message.payload;
        const user = userManager.getUser(payload.roomId, payload.userId);
        if (!user) {
            console.error("User not found in the db");
            return;
        }
        
        let chat = store.addChat(payload.userId, user.name, payload.roomId, payload.message);
        if (!chat) {
            return;
        }
        
        const outgoingPayload: OutgoingMessage = {
            type: OutgoingSupportedMessages.AddChat,
            payload: {
                chatId: chat.id,
                roomId: payload.roomId,
                message: payload.message,
                name: user.name,
                upvotes: 0
            }
        }
        userManager.broadcast(payload.roomId, payload.userId, outgoingPayload);
    }

    if (message.type === SupportedMessage.UpvoteMessage) {
        const payload = message.payload;
        const chat = store.upvote(payload.userId, payload.roomId, payload.chatId);
        console.log("Inside upvote")

        if (!chat) {
            return;
        }
        
        console.log("Inside upvote 2")

        const outgoingPayload: OutgoingMessage = {
            type: OutgoingSupportedMessages.UpdateChat,
            payload: {
                chatId: payload.chatId,
                roomId: payload.roomId,
                upvotes: chat.upvotes.length
            }
        }
        
        console.log("Inside upvote 3")
        userManager.broadcast(payload.roomId, payload.userId, outgoingPayload);
    }
}