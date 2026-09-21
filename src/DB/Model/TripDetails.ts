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
        allowNull: false
    },
    tripName:{
        type: DataTypes.STRING,
        allowNull: false
    },
    tripItinerary:{
        type: DataTypes.TEXT,
        allowNull: false
    },
    startDate:{
        type: DataTypes.DATE,
        allowNull: false
    },
    endDate:{
        type: DataTypes.DATE,
        allowNull: false
    },
    budget:{
        type: DataTypes.FLOAT,
        allowNull: true
    }
});

export default TripDetails;