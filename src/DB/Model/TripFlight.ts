
import sequelize from "../dbConfig";
import { DataTypes } from "sequelize";

const TripFlight = sequelize.define("TripFlight", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    flightId: {
        type: DataTypes.STRING,
    },
    airline: {
        type: DataTypes.STRING,
    },
    airlineLogo: {
        type: DataTypes.STRING,
    },
    flightNumber: {
        type: DataTypes.STRING,
    },
    origin: {
        type: DataTypes.STRING,
    },
    originCode: {
        type: DataTypes.STRING,
    },
    destination: {
        type: DataTypes.STRING,
    },
    destinationCode: {
        type: DataTypes.STRING,
    },
    departure: {
        type: DataTypes.DATE,
    },
    arrival: {
        type: DataTypes.DATE,
    },
    durationMinutes: {
        type: DataTypes.INTEGER,
    },
    stops: {
        type: DataTypes.INTEGER,
    },
    price: {
        type: DataTypes.FLOAT,
    },
    formattedPrice: {
        type: DataTypes.STRING,
    },
    segments: {
        type: DataTypes.TEXT,
    },
    isRefundable: {
        type: DataTypes.BOOLEAN,
    },
    emissionsKg: {
        type: DataTypes.FLOAT,
    },
    isBooked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    base62: {
        type: DataTypes.STRING,
    },
    bookedBy: {
        type: DataTypes.STRING,
    },
    bookingGroupId: {
        type: DataTypes.STRING,
    },
    
    tripType: {
        type: DataTypes.STRING,
        defaultValue: "One-way",
    },
});

export default TripFlight;
