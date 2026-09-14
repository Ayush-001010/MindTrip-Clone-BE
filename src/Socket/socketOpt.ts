import { Server } from "socket.io";
import SocketService from "../Service/SocketService/SocketService";
import { fetchTripChat, tripItineraryHandler } from "../Controller/Copilot";

export const initSocket = (io: Server) => {
    io.on("connection", (socket) => {
        console.log("A user connected via socket:", socket.id);
        const socketInstance = new SocketService();

        socket.on("room:join", (data) => {
            const { tripID, userID, userName } = data;
            console.log("Add to room response:", { tripID, userID, userName });
            socketInstance.addToRoom(socket, tripID, userID, userName).then((response) => {
                if (!response.socketOptSuccess) {
                    console.log("Failed to add user to room:", tripID, userID);
                } else {
                    io.to(tripID).emit("room:joined", { userName });
                }
            }).catch((error) => {
                console.error("Failed to handle room join:", error);
            });
        });

        socket.on("room:chat", async (data) => {
            const { tripID , userPrompt } = data;
            const response = await tripItineraryHandler(userPrompt, tripID);
            io.to(tripID).emit("room:chat-response", { ...response });
        });

        socket.on("room:fetchOldChat", async (data) => {
            const { tripID , userID } = data;
            const response:any = await fetchTripChat(tripID, userID);
            io.to(tripID).emit("room:oldChatDetails", { response });
        });
    });
};