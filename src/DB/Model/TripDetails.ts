import sequelize from "../dbConfig";
import { DataTypes } from "sequelize";


const TripDetails = sequelize.define("TripDetails", {
    id : {
        primaryKey : true,
        type : DataTypes.INTEGER,
        autoIncrement : true
    },
    tripID:{
        type: DataTypes.STRING,
        allowNull: true
    },
    tripName:{
        type: DataTypes.STRING,
        allowNull: true
    },
    tripItinerary:{
        type: DataTypes.TEXT,
        allowNull: true
    },
    startDate:{
        type: DataTypes.DATE,
        allowNull: true
    },
    endDate:{
        type: DataTypes.DATE,
        allowNull: true
    },
    budget:{
        type: DataTypes.FLOAT,
        allowNull: true
    }
});

export default TripDetails;