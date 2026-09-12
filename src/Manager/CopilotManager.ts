import CopilotService from "../Service/Copilot/CopilotService";
import DataBaseService from "../Service/Database/Database";

export default class CopilotManager {
  tripItinerary = async (userMessage: string, tripID: string) => {
    try {
      const databaseInstance = new DataBaseService();
      const records = await databaseInstance.fetchData<any>(
        "TripChat",
        undefined,
        undefined,
        { tripID: tripID, userID: "123" },
        [["messageDate", "ASC"]],
      );
      const dbResponse = await databaseInstance.createData<any>("TripChat", {
        userID: "123",
        tripID: tripID,
        message: userMessage,
        response: "",
        messageDate: new Date(),
      });
      if (dbResponse.dataSuccess) {
        const copilotInstance = new CopilotService();
        const copilotResponse =
          await copilotInstance.coordinatorAgent(userMessage , records.data);
        if (copilotResponse.success) {
          const updateResponse = await databaseInstance.updateData(
            "TripChat",
            { response: JSON.stringify(copilotResponse.data) },
            { id: dbResponse.data.dataValues.id },
          );
          if (updateResponse.dataSuccess) {
            return copilotResponse;
          } else {
            throw new Error("Failed to update the response in the database.");
          }
        }
      } else {
        throw new Error("Failed to insert the user message into the database.");
      }
    } catch (error) {
      console.log("Error in tripItinerary:", error);
      return {
        success: false,
        data: {
          message: "An error occurred while processing your request.",
        },
      };
    }
  };
  fetchTripChat = async (tripID: string, userID: string) => {
    try {
      const databaseInstance = new DataBaseService();
      const dbResponse = await databaseInstance.fetchData<any>(
        "TripChat",
        undefined,
        undefined,
        { tripID: tripID, userID: userID },
        [["messageDate", "ASC"]],
      );
      if (dbResponse.dataSuccess) {
        console.log("Data fetched successfully");
        return {
          success: true,
          data: dbResponse.data,
        };
      } else {
        throw new Error("Failed to fetch the trip chat from the database.");
      }
    } catch (error) {
      console.log("Error in fetchTripChat:", error);
      return {
        success: false,
        data: {
          message: "An error occurred while fetching the trip chat.",
        },
      };
    }
  };
}
