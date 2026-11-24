interface FlightPlace {
    id: string;
    entityId: string;
    name: string;
    displayCode: string;
    city?: string;
    country?: string;
  }
  
  interface FlightSegment {
    flightNumber: string;
    origin: {
      displayCode: string;
      name: string;
    };
    destination: {
      displayCode: string;
      name: string;
    };
    departure: string;
    arrival: string;
    durationInMinutes: number;
    marketingCarrier: {
      name: string;
      displayCode: string;
      alternateId?: string;
    };
    operatingCarrier?: {
      name: string;
      displayCode: string;
    };
  }
  
  interface FlightLeg {
    origin: FlightPlace;
    destination: FlightPlace;
    departure: string;
    arrival: string;
    durationInMinutes: number;
    stopCount: number;
    carriers: {
      marketing: {
        name: string;
        logoUrl: string;
      }[];
    };
    segments: FlightSegment[];
  }
  
  interface RawFlight {
    id: string;
    price: {
      raw: number;
      formatted: string;
    };
    legs: FlightLeg[];
    farePolicy?: {
      isChangeAllowed: boolean;
      isCancellationAllowed: boolean;
    };
    emissions?: {
      emissionsKg: number;
    };
  }
  
  export interface RawFlightResponse {
    status?: boolean;
    message?: string;
    data?: {
        status?: boolean;
        count?: number;
        timestamp?: number;

        context?: {
            status?: string;
            sessionId?: string;
        };

        itineraries?: {
            results?: RawFlight[];
        };

        data?: {
            context?: {
                status?: string;
                sessionId?: string;
            };

            itineraries?: {
                results?: RawFlight[];
            };
        };
    };
}
  export interface ParsedFlight {
    id: string;
    price: number;
    formattedPrice: string;
    airline: string;
    airlineLogo: string;
    flightNumber: string;
    origin: string;
    originCode: string;
    destination: string;
    destinationCode: string;
    departure: string;
    arrival: string;
    durationMinutes: number;
    stops: number;
    segments: FlightSegment[];
    isRefundable: boolean;
    emissionsKg?: number;
    tripType?: "One-way" | "Round-trip";
returnLeg?: {
    origin: string;
    originCode: string;
    destination: string;
    destinationCode: string;
    departure: string;
    arrival: string;
    durationMinutes: number;
    stops: number;
    segments: FlightSegment[];
    airline: string;
    airlineLogo: string;
    flightNumber: string;
};
  }
  
  class FlightParser {
   
parse(response: RawFlightResponse): ParsedFlight[] {
    const results =
        response.data?.itineraries?.results ??
        response.data?.data?.itineraries?.results ??
        [];

    return results.flatMap((flight) => {
        const outboundLeg = flight.legs?.[0];
        const returnLeg = flight.legs?.[1];

        if (!outboundLeg || !outboundLeg.segments?.length) {
            return [];
        }

        const getLegDetails = (leg: FlightLeg) => {
            const firstSegment = leg.segments[0];

            return {
                origin: leg.origin.name,
                originCode: leg.origin.displayCode,
                destination: leg.destination.name,
                destinationCode: leg.destination.displayCode,
                departure: leg.departure,
                arrival: leg.arrival,
                durationMinutes: leg.durationInMinutes,
                stops: leg.stopCount,
                segments: leg.segments,
                airline:
                    leg.carriers.marketing?.[0]?.name ??
                    firstSegment.marketingCarrier?.name ??
                    "Unknown Airline",
                airlineLogo:
                    leg.carriers.marketing?.[0]?.logoUrl ?? "",
                flightNumber:
                    `${firstSegment.marketingCarrier?.displayCode ?? ""} ${firstSegment.flightNumber ?? ""}`.trim(),
            };
        };

        const outbound = getLegDetails(outboundLeg);

        const returning =
            returnLeg?.segments?.length
                ? getLegDetails(returnLeg)
                : undefined;

        return [{
            id: flight.id,
            price: flight.price.raw,
            formattedPrice: flight.price.formatted,

            ...outbound,

            tripType: returning ? "Round-trip" : "One-way",
            returnLeg: returning,

            isRefundable:
                flight.farePolicy?.isCancellationAllowed ?? false,

            emissionsKg: flight.emissions?.emissionsKg,
        }];
    });
}

  }
  
  export default FlightParser;