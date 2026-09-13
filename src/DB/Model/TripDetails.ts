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
    }
});

export default TripDetails;