import sequelize from "../dbConfig";
import { DataTypes } from "sequelize";

const FavouritesHotel = sequelize.define("FavouritesHotel", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    type:{
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "hotel"
    },
    placeName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    hotelName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    hotelImage: {
        type: DataTypes.STRING,
        allowNull: false
    },
    hotelDescription: {
        type: DataTypes.STRING,
        allowNull: false
    },
    longitude: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    latitude: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    rating: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    reviews: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    link: {
        type: DataTypes.STRING,
        allowNull: false
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false
    }
});

export default FavouritesHotel;