import { Server } from "socket.io";
import SocketService from "../Service/SocketService/SocketService";
import { fetchTripChat, tripItineraryHandler } from "../Controller/Copilot";
import Trip from "../Service/Trip/Trip";
import SplitWiseFacade from "../Service/SplitWise/SplitWiseFacade";

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

        socket.on("room:setTripStartAndEnd", async (data) => {
            const { tripID, startDate, endDate } = data;
            const tripServiceInstance = new Trip();
            let response : any = await tripServiceInstance.setTripStartAndEnd(tripID, startDate, endDate);
            response.data = {
                startDate,
                endDate
            }
            io.to(tripID).emit("room:setTripStartAndEnd-response", { ...response });
        });

        socket.on("room:setTripBudget", async (data) => {
            const { tripID, budget } = data;
            const tripServiceInstance = new Trip();
            let response : any = await tripServiceInstance.setTripBudget(tripID, budget);
            response.data = {
                budget
            }
            io.to(tripID).emit("room:setTripBudget-response", { ...response });
        });

        socket.on("room:addExpense", async (data) => {
            const { tripID, paidBy, totalAmount, title, category, spendAt, splitMethod, splitAmong, notes } = data;
            console.log("Add expense request:", { tripID, paidBy, totalAmount, title, category, spendAt, splitMethod, splitAmong, notes });
            const splitWiseFacadeInstance = new SplitWiseFacade(tripID);
            const response = await splitWiseFacadeInstance.addExpense(paidBy, totalAmount, title, category, spendAt, splitMethod, splitAmong, notes);
            io.to(tripID).emit("room:addExpense-response", { success: response.splitOptSuccess, data:`Expense of ₹${totalAmount} logged by ${paidBy.userName}` });
        });
    });
};