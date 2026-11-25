import APIResponseInterface from "../Interface/ResponseInterface/APIResponseInterface";
import CopilotService from "../Service/Copilot/CopilotService";
import CommonService from "../Service/Common/CommonService";
import DataBaseService from "../Service/Database/Database";
import type { MascotColorMode } from "../Interface/DataInterface/ICharacterSpecification";

export default class CopilotManager {
  private databaseInstance: DataBaseService;

  constructor() {
    this.databaseInstance = new DataBaseService();
  }
  genrateCartoon = async (userPrompt: string, base64Image?: Buffer, colorMode?: MascotColorMode) => {
      try {
        const copilotInstance = new CopilotService();
        return await copilotInstance.coordinatorAgent(userPrompt, [], "", -1, base64Image, colorMode);
      } catch (error) {
        console.log("Error in genrateCartoon:", error);
        return {
          success: false,
          error: error instanceof Error
            ? `Cartoon generation failed: ${error.message}`
            : "Cartoon generation failed. Check the Copilot runtime connection and authentication.",
        };
    };
  }
  private fetchBookedFlights = async (tripID: string) => {
    const response = await this.databaseInstance.fetchData<any>(
      "TripFlight",
      undefined,
      undefined,
      {
        base62: tripID,
        isBooked: true,
      }
    );

    if (!response.dataSuccess) {
      throw new Error("Failed to fetch booked flights.");
    }

    return response.data ?? [];
  };
  private createTripHistoryItem = async (
    userID: string,
    tripID: string,
    userMessage: string
  ) => {
    const dbResponse = await this.databaseInstance.createData<any>("TripChat", {
      userID: userID,
      tripID: tripID,
      message: userMessage,
      response: "",
      messageDate: new Date(),
    });
    return dbResponse;
  };

  private updateTripHistoryItem = async (
    copilotResponse: APIResponseInterface<any>,
    id: string
  ) => {
    const updateResponse = await this.databaseInstance.updateData(
      "TripChat",
      { response: JSON.stringify(copilotResponse.data) },
      { id }
    );
    return updateResponse;
  };

  private fetchTripHistory = async (tripID: string, userID: string) => {
    const dbResponse = await this.databaseInstance.fetchData<any>(
      "TripChat",
      undefined,
      undefined,
      { tripID: tripID, userID: userID },
      [["messageDate", "ASC"]]
    );
    return dbResponse;
  };

 
tripItinerary = async (
  userMessage: string,
  tripID: string,
  userID: string
) => {
  try {
    const records = await this.fetchTripHistory(tripID, userID);

    let confirmationResponse: any = null;
    let effectiveUserMessage = userMessage;

    const normalizedMessage = userMessage.trim().toLowerCase();

    const lastRecord = records.data?.[records.data.length - 1];

    let lastAssistantResponse: any = null;

    if (lastRecord?.response) {
      try {
        lastAssistantResponse =
          typeof lastRecord.response === "string"
            ? JSON.parse(lastRecord.response)
            : lastRecord.response;
      } catch {
        lastAssistantResponse = null;
      }
    }

    const isAwaitingFlightConfirmation =
      lastAssistantResponse?.confirmationType ===
      "flight-booking-confirmation";

    const isNewFlightSearchRequest =
      normalizedMessage.includes(
        "search for flights for my current trip"
      );

    console.log(
      "Flight search request detected:",
      isNewFlightSearchRequest
    );
    console.log(
      "Confirmation pending:",
      isAwaitingFlightConfirmation
    );

    // Handle a new flight search request first.
    if (isNewFlightSearchRequest) {
      const bookedFlights = await this.fetchBookedFlights(tripID);

      console.log("Existing booked flights:", bookedFlights);
      console.log("Booked flight count:", bookedFlights.length);

      if (bookedFlights.length > 0) {
        confirmationResponse = {
          type: "text",
          confirmationType: "flight-booking-confirmation",
          message:
            "You already have a flight booked for this trip. Would you like to book another flight? Please reply Yes or No.",
        };
      }
    }

    // Handle Yes/No only when the user is answering a pending confirmation.
    else if (isAwaitingFlightConfirmation) {
      if (
        ["yes", "yes please", "sure", "yeah"].includes(normalizedMessage)
      ) {
        effectiveUserMessage =
          "I want to search for flights for my current trip. Use my existing trip destination and ask me only for the flight details you still need. Do not ask me for my destination again.";
      } else if (
        ["no", "no thanks", "no thank you"].includes(normalizedMessage)
      ) {
        confirmationResponse = {
          type: "text",
          message:
            "No problem! Your existing flight booking remains unchanged.",
        };
      } else {
        confirmationResponse = {
          type: "text",
          confirmationType: "flight-booking-confirmation",
          message:
            "Please select Yes if you want to search for another flight, or No to keep your existing booking.",
        };
      }
    }

    console.log("NEW FLIGHT SEARCH:", isNewFlightSearchRequest);
console.log("LAST ASSISTANT RESPONSE:", lastAssistantResponse);
console.log("BOOKING CONFIRMATION PENDING:", isAwaitingFlightConfirmation);

    const dbResponse = await this.createTripHistoryItem(
      userID,
      tripID,
      userMessage
    );

    if (dbResponse.dataSuccess) {
      const copilotInstance = new CopilotService();

      const copilotResponse = confirmationResponse
        ? { success: true, data: confirmationResponse }
        : await copilotInstance.coordinatorAgent(
            effectiveUserMessage,
            records.data,
            tripID,
            parseInt(userID)
          );

      if (copilotResponse.success) {
        const updateResponse = await this.updateTripHistoryItem(
          copilotResponse,
          dbResponse.data.dataValues.id
        );

        const fetchLastTripData = await this.fetchLastTripChat(
          tripID,
          userID
        );

        console.log("Confirmation response:", confirmationResponse);

        if (updateResponse.dataSuccess) {
          return {
            success: true,
            data: fetchLastTripData.data,
          };
        } else {
          throw new Error(
            "Failed to update the response in the database."
          );
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
        { tripID: tripID },
        [["messageDate", "ASC"]]
      );
      if (dbResponse.dataSuccess) {
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

  fetchLastTripChat = async (tripID: string, userID: string) => {
    try {
      const databaseInstance = new DataBaseService();
      const dbResponse = await databaseInstance.fetchData<any>(
        "TripChat",
        1,
        undefined,
        { tripID: tripID, userID: userID },
        [["messageDate", "DESC"]]
      );
      if (dbResponse.dataSuccess) {
        return {
          success: true,
          data: dbResponse.data[0],
        };
      } else {
        throw new Error(
          "Failed to fetch the last trip chat from the database."
        );
      }
    } catch (error) {
      console.log("Error in fetchLastTripChat:", error);
      return {
        success: false,
        data: {
          message: "An error occurred while fetching the last trip chat.",
        },
      };
    }
  };
}
