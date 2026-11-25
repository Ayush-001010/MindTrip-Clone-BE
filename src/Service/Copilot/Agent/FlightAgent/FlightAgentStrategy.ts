import { HEAVY_MODEL, LIGHT_MODEL } from "../../../../config/models";

import CopilotClientFactory from "../../../../Factory/CopilotClientFactory";
import FlightPrompt from "../../../../Prompt/FlightPrompt";
import FlightInformationGatherPrompt from "../../../../Prompt/FlightInformationGatherPrompt";
import ITripHistory from "../../../../Interface/DataInterface/ITripHistory";
import IAgentStrategy from "../../../../Interface/ClassInterface/IAgentStrategy";
import FlightService from "../../../Flight/FlightService";
import CommonService from "../../../Common/CommonService";
export default class FlightAgentStrategy implements IAgentStrategy {
  constructor(
    private finalItinerary: any,
    private flightService = new FlightService()
  ) {}
  public static readonly getInstance = async (tripID: string) => {
    const isFinalItineraryExist =
      await CommonService.getInstance().checkIsFinalItineraryIsCreatedOrNot(
        tripID
      );

    if (isFinalItineraryExist) {
      return new FlightAgentStrategy(isFinalItineraryExist);
    } else {
      return null;
    }
  };
  private getRoute = async (
    prompt: string,
    history: Array<ITripHistory>
  ): Promise<{
    route:
      | "flight-question-gather-agent"
      | "flight-search-agent"
      | "fallback-agent";
  }> => {
    try {
      const copilotClientInstance = CopilotClientFactory.getInstance();

      const session = await copilotClientInstance.createSession({
        sessionId: `flight-route-${Date.now()}`,
        model: LIGHT_MODEL,
        availableTools: [],
        systemMessage: {
          content: FlightPrompt,
        },
      });

      const response = await session.sendAndWait({
        prompt: JSON.stringify({
          history,
          finalItinerary: this.finalItinerary,
          userPrompt: prompt,
        }),
      });

      await session.disconnect();

      try {
        return JSON.parse(response?.data?.content || "{}");
      } catch {
        return { route: "fallback-agent" };
      }
    } catch (error) {
      console.error("Flight routing error:", error);
      return { route: "fallback-agent" };
    }
  };

  private flightQuestionGatherAgent = async (
    prompt: string,
    history: Array<ITripHistory>
  ) => {
    try {
      const copilotClientInstance = CopilotClientFactory.getInstance();

      const session = await copilotClientInstance.createSession({
        sessionId: `flight-question-gather-${Date.now()}`,
        model: HEAVY_MODEL,
        availableTools: [],
        systemMessage: {
          content: FlightInformationGatherPrompt,
        },
      });

      const response = await session.sendAndWait({
        prompt: JSON.stringify({
          history,
          finalItinerary: this.finalItinerary,
          userPrompt: prompt,
        }),
      });

      await session.disconnect();

      try {
        return JSON.parse(response?.data?.content || "{}");
      } catch {
        return {
          type: "text",
          message:
            "I couldn't understand the flight details. Please try again.",
        };
      }
    } catch (error) {
      console.error("Flight question gathering error:", error);

      return {
        type: "text",
        message:
          "I'm unable to gather flight details right now. Please try again.",
      };
    }
  };

  async executeAgent(prompt: string, history: any[] = []) {
    const destination = this.getDestinationFromItinerary();

    console.log("Extracted flight destination:", destination);
    const normalizedPrompt = prompt.toLowerCase();

    // Direct routing for the initial flight search request
    // if (
    //     normalizedPrompt.includes("search for flights for my current trip") &&
    //     normalizedPrompt.includes("do not ask me for my destination again")
    // ) {
    //     console.log("Initial flight request detected → flight-question-gather-agent");

    //     const response = await this.flightQuestionGatherAgent(prompt, history);

    //     console.log("Flight question gather response:", response);

    //     return response;
    // }
    if (
      normalizedPrompt.includes("search for flights for my current trip") &&
      normalizedPrompt.includes("do not ask me for my destination again")
    ) {
      console.log("Initial flight request detected → returning flight form");

      return {
        type: "question-gather",
        questionDescription: "Enter your flight details",
        questions: [
          {
            description: "Departure city or airport",
            type: "text",
            multiple: false,
            options: [],
            required: true,
          },
          {
            description: "Trip type",
            type: "single-choice",
            multiple: false,
            options: ["One-way", "Round-trip"],
            required: true,
          },
          {
            description: "Departure date",
            type: "date",
            multiple: false,
            options: [],
            required: true,
          },
          {
            description: "Return date",
            type: "date",
            multiple: false,
            options: [],
            required: false,
          },
          {
            description: "Number of adults",
            type: "counter",
            min: 1,
            max: 9,
            defaultValue: 1,
            required: true,
          },
          {
            description: "Number of children",
            type: "counter",
            min: 0,
            max: 9,
            defaultValue: 0,
            required: false,
          },
          {
            description: "Number of infants",
            type: "counter",
            min: 0,
            max: 3,
            defaultValue: 0,
            required: false,
          },
          {
            description: "Cabin class",
            type: "single-choice",
            multiple: false,
            options: ["Economy", "Premium Economy", "Business", "First"],
            required: true,
          },
        ],
      };
    }

    const coordinates = await this.getRoute(prompt, history);
    const { route } = coordinates;

    console.log("Route determined by flight agent:", route);

    switch (route) {
      case "flight-question-gather-agent":
        return await this.flightQuestionGatherAgent(prompt, history);

      case "flight-search-agent":
        return await this.flightSearchAgent(prompt);

      case "fallback-agent":
      default:
        return {
          type: "text",
          message: "I can help you search for flights for your trip.",
        };
    }
  }

  private resolveAirport = async (query: string) => {
    const airports = await this.flightService.searchAirport(query);

    if (!airports || airports.length === 0) {
      throw new Error(`No airport found for: ${query}`);
    }

    const normalizedQuery = query.trim().toLowerCase();

    const matchedAirport = airports.find((airport) => {
      const name = airport.navigation.localizedName?.toLowerCase();
      const title = airport.presentation.title?.toLowerCase();

      return name === normalizedQuery || title === normalizedQuery;
    });

    const airport = matchedAirport ?? airports[0];

    return airport.navigation.relevantFlightParams;
  };

  private extractFlightDetails = (prompt: string) => {
    try {
      const parsedPrompt = JSON.parse(prompt);

      return {
        origin: parsedPrompt["Departure city or airport"],
        destination: parsedPrompt["Destination city or airport"],
        tripType: parsedPrompt["Trip type"],
        departureDate: parsedPrompt["Departure date"],
        returnDate:
          parsedPrompt["Trip type"] === "Round-trip"
            ? parsedPrompt["Return date"]
            : undefined,
        adults: Number(parsedPrompt["Number of adults"] ?? 1),
        children: Number(parsedPrompt["Number of children"] ?? 0),
        infants: Number(parsedPrompt["Number of infants"] ?? 0),
        cabinClass:
          parsedPrompt["Cabin class"]?.toLowerCase().replace(/\s+/g, "_") ??
          "economy",
      };
    } catch (error) {
      console.error("Failed to parse flight details:", error);
      return null;
    }
  };

  private getDestinationFromItinerary = (): string | null => {
    try {
      const itinerary =
        typeof this.finalItinerary?.tripItinerary === "string"
          ? JSON.parse(this.finalItinerary.tripItinerary)
          : this.finalItinerary?.tripItinerary;
  
      const title = itinerary?.itineraryTitle || this.finalItinerary?.tripName;
  
      if (!title) return null;
  
      let destination = title;
  
      // Remove the itinerary title prefix
      destination = destination.replace(/^.*?:\s*/, "");
  
      // Remove common itinerary suffixes
      destination = destination
        .replace(/favorites itinerary/i, "")
        .replace(/relaxed sightseeing trip/i, "")
        .replace(/sightseeing trip/i, "")
        .replace(/travel trip/i, "")
        .replace(/itinerary/i, "")
        .replace(/trip/i, "")
        .trim();
  
      return destination || null;
    } catch (error) {
      console.error("Failed to extract destination from itinerary:", error);
      return null;
    }
  };
  private flightSearchAgent = async (prompt: string) => {
    try {
      const flightDetails = this.extractFlightDetails(prompt);

      if (!flightDetails) {
        return {
          type: "text",
          message: "Unable to read flight details. Please try again.",
        };
      }

      const destination = this.getDestinationFromItinerary();

      if (!destination) {
        return {
          type: "text",
          message: "Unable to determine your trip destination.",
        };
      }

      console.log("Flight search details:", flightDetails);
      console.log("Flight destination:", destination);

      const originAirport = await this.resolveAirport(flightDetails.origin);
      const destinationAirport = await this.resolveAirport(destination);

      console.log("Resolved origin airport:", originAirport);
      console.log("Resolved destination airport:", destinationAirport);
      console.log("Origin airport params:", {
        skyId: originAirport.skyId,
        entityId: originAirport.entityId,
    });
    
    console.log("Destination airport params:", {
        skyId: destinationAirport.skyId,
        entityId: destinationAirport.entityId,
    });
    
    console.log("Departure date:", flightDetails.departureDate);
    console.log("Return date:", flightDetails.returnDate);
      const flights = await this.flightService.searchFlights({
        originSkyId: originAirport.skyId,
        destinationSkyId: destinationAirport.skyId,
        originEntityId: originAirport.entityId,
        destinationEntityId: destinationAirport.entityId,
        date: flightDetails.departureDate,
        returnDate: flightDetails.returnDate,
        adults: flightDetails.adults,
        childrens: flightDetails.children,
        infants: flightDetails.infants,
        cabinClass: flightDetails.cabinClass as
          | "economy"
          | "premium_economy"
          | "business"
          | "first",
      });

      console.log("Flight search results:", flights);

      return {
        type: "flight-results",
        origin: flightDetails.origin,
        destination,
        flights,
      };
    } catch (error) {
      console.error("Flight search agent error:", error);

      return {
        type: "text",
        message: "Sorry, I couldn't fetch flights right now. Please try again.",
      };
    }
  };
}
