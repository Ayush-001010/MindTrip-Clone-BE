import { Server } from "socket.io";
import SocketService from "../Service/SocketService/SocketService";
import { fetchTripChat, tripItineraryHandler } from "../Controller/Copilot";
import Trip from "../Service/Trip/Trip";
import SplitWiseFacade from "../Service/SplitWise/SplitWiseFacade";
import CopilotManager from "../Manager/CopilotManager";
import GroupHub from "../Service/GroupHub/GroupHub";

export const initSocket = (io: Server) => {
  io.on("connection", (socket) => {
    // console.log("A user connected via socket:", socket.id);
    const socketInstance = new SocketService();

    socket.on("room:join", (data) => {
      const { tripID, userID, userName } = data;
    //   console.log("Add to room response:", { tripID, userID, userName });
      socketInstance
        .addToRoom(socket, tripID, userID, userName)
        .then(async (response) => {
          if (!response.socketOptSuccess) {
            console.log("Failed to add user to room:", tripID, userID);
          } else {
            io.to(tripID).emit("room:joined", { userName });
            const tripServiceInstance = new Trip();
            const suggestionDateResponse = await tripServiceInstance.checkAndSuggestTripDates(tripID);

            if(suggestionDateResponse.success && !suggestionDateResponse.data?.isAlreadyExist) {
              io.to(tripID).emit("room:suggestedTripDates-response", { ...suggestionDateResponse });
            }
          }
        })
        .catch((error) => {
          console.error("Failed to handle room join:", error);
        });
    });

    socket.on("room:chat", async (data) => {
      const { tripID, userPrompt, userID } = data;
      console.log("Room chat request:", { tripID, userPrompt, userID });
      const response = await tripItineraryHandler(userPrompt, tripID, userID);
      io.to(tripID).emit("room:chat-response", { ...response });
    });

    socket.on("room:fetchOldChat", async (data) => {
      const { tripID, userID } = data;
      const response: any = await fetchTripChat(tripID, userID);
    //   console.log("Fetch old chat response:", { tripID, userID, response });
      io.to(tripID).emit("room:oldChatDetails", { response });
    });

    socket.on("room:setTripStartAndEnd", async (data) => {
      const { tripID, startDate, endDate } = data;
      const tripServiceInstance = new Trip();
      let response: any = await tripServiceInstance.setTripStartAndEnd(
        tripID,
        startDate,
        endDate,
      );
      response.data = {
        startDate,
        endDate,
      };
      io.to(tripID).emit("room:setTripStartAndEnd-response", { ...response });
    });

    socket.on("room:setTripBudget", async (data) => {
      const { tripID, budget } = data;
      const tripServiceInstance = new Trip();
      let response: any = await tripServiceInstance.setTripBudget(
        tripID,
        budget,
      );
      response.data = {
        budget,
      };
      io.to(tripID).emit("room:setTripBudget-response", { ...response });
    });

    socket.on("room:addExpense", async (data) => {
      const {tripID,paidBy,totalAmount,title,category,spendAt,splitMethod,splitAmong,notes} = data;
      const tripServiceInstance = new Trip();
      const tripDetails = await tripServiceInstance.fetchTripDetails("",tripID);
      const id = tripDetails?.data?.id;
      
      const splitWiseFacadeInstance = new SplitWiseFacade(id ? parseInt(id) : 0);
      const response = await splitWiseFacadeInstance.addExpense(paidBy,totalAmount,title,category,spendAt,splitMethod,splitAmong,notes);
      io.to(tripID).emit("room:addExpense-response", {
        success: response.splitOptSuccess,
        data: `Expense of ₹${totalAmount} logged by ${paidBy.userName}`,
      });
    });

    socket.on("room:hotelRequest", async (data) => {
      const { tripID, userPrompt, userID } = data;
      console.log("Hotel request:", { tripID, userPrompt, userID });
      const copilotClientInstance = new CopilotManager();
      const response = await copilotClientInstance.tripItinerary(
        userPrompt,
        tripID,
        "3",
      );
      io.to(tripID).emit("room:hotelRequest-response", { ...response });
    });

    socket.on("room:editTripName", async (data) => {
        const { tripID, newTripName } = data;
        const tripServiceInstance = new Trip();
        let response: any = await tripServiceInstance.editTripName(
          tripID,
          newTripName,
        );
        
        io.to(tripID).emit("room:editTripName-response",{
            mssg : response.success ? `Trip name changed to ${newTripName}` : `Failed to change trip name`,
        } )
    });

    socket.on("room:createTripHotel", async (data) => {
      const { tripHotelData, type , userId , userName } = data;
      console.log("Create Trip Hotel request:", { tripHotelData, type , userId , userName });
      const { id } = tripHotelData;
      const tripServiceInstance = new Trip();
      let success = false;
      let resData: any = null;
      if(!id){
        let response: any = await tripServiceInstance.createTripHotel(tripHotelData,type);
        success = response.success;
        resData = response.data;
      } else {
        let response: any = await tripServiceInstance.updateBookingDate(tripHotelData);
        success = response.success;
        resData = response.data;
      }
      console.log("Trip ID: ", tripHotelData.base62);
      console.log("Create Trip Hotel Response: ", { success, resData });
      io.to(tripHotelData.base62).emit("room:createTripHotel-response", {
        success: success,
        data: resData,
      });

      // Check and suggest trip dates after creating or updating a trip hotel
      const suggestionDateResponse = await tripServiceInstance.checkAndSuggestTripDates(tripHotelData.base62);

      if(suggestionDateResponse.success && !suggestionDateResponse.data?.isAlreadyExist) {
        io.to(tripHotelData.base62).emit("room:suggestedTripDates-response", { ...suggestionDateResponse });
      }

      // Add Hotel Amount to Split Wise
      const tripDetailsResponse = await tripServiceInstance.fetchTripDetails(tripHotelData.base62, tripHotelData.base62);
      const tripMemberDetailsResponse = await tripServiceInstance.fetchTripMemberDetails(tripHotelData.base62);
      console.log("Trip Member Details Response: ", tripMemberDetailsResponse);
      console.log("Trip Details Response: ", tripDetailsResponse);
      const tripID = tripDetailsResponse.data?.id || "";


      const splitWiseInstance = new SplitWiseFacade(parseInt(tripID));

      const splitWiseUsers = tripMemberDetailsResponse.data?.map(member => ({
        userId: parseInt(member.userId),
        userName: member.userName,
        amount : tripHotelData.price / (tripMemberDetailsResponse.data?.length || 1)
      })) || [];


      const spliWiseResponse = await splitWiseInstance.addExpense({userId: parseInt(userId), userName: userName} , tripHotelData.price || 0, tripHotelData.name , "Hotel" , new Date() , "equal" , splitWiseUsers , "");

      console.log("Split Wise Response: ", spliWiseResponse);

      io.to(tripHotelData.base62).emit("room:addHotelAmount-response", { success: spliWiseResponse.splitOptSuccess, data: spliWiseResponse.data });

    });

    socket.on("room:newGroupMessage", async (data) => {
      const { userID, userName, message } = data;
      console.log("New group message:", { userID, userName, message });
      const groupHubInstance = new GroupHub();
      const response = await groupHubInstance.newMessage(userID, userName, message);
      io.to(message.base62).emit("room:newGroupMessage-response", { ...response });
    });

  });
};
