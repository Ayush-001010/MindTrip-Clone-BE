import sequelize from "../dbConfig";
import { DataTypes } from "sequelize";

const TripHotel = sequelize.define("TripHotel", {
    id : {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name : {
        type: DataTypes.STRING,
    },
    description:{
        type: DataTypes.STRING,
    },
    latitude: {
        type: DataTypes.FLOAT,
    },
    longitude: {
        type: DataTypes.FLOAT,
    },
    rating : {
        type: DataTypes.FLOAT,
    },
    reviews: {
        type: DataTypes.INTEGER,
    },
    price: {
        type: DataTypes.FLOAT,
    },
    image:{
        type: DataTypes.STRING,
    },
    amenities: {
        type: DataTypes.TEXT,
    },
    link: {
        type: DataTypes.STRING,
    },
    isBooked: {
        type: DataTypes.BOOLEAN,
    },
    base62 : {
        type: DataTypes.STRING,
    },
    toDate: {
        type: DataTypes.DATE,
    },
    fromDate: {
        type: DataTypes.DATE,
    },
    likeCount: {
        type: DataTypes.INTEGER,
    },
    dislikeCount: {
        type: DataTypes.INTEGER,
    },
    comment:{
        type: DataTypes.TEXT,
    }
});

export default TripHotel;