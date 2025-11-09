export enum OutgoingSupportedMessages {
    AddChat = "ADD_CHAT",
    UpdateChat = "UPDATE_CHAT",
}
    
type MessagePayload = {
    roomId: string;
    message: string;
    name: string;
    upvotes: number;
    chatId: string;
}

export type OutgoingMessage = {
    type: OutgoingSupportedMessages.AddChat,
    payload: MessagePayload
} | {
    type: OutgoingSupportedMessages.UpdateChat,
    payload: Partial<MessagePayload>
}