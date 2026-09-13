import sequelize from "../dbConfig";
import { DataTypes } from "sequelize";


const TripID = sequelize.define("TripID", {
    id : {
        primaryKey : true,
        type : DataTypes.INTEGER,
        autoIncrement : true
    },
    userID : {
        type : DataTypes.STRING,
        allowNull : false
    },
    tripID:{
        type: DataTypes.STRING,
        allowNull: false
    },
    base62:{
        type: DataTypes.STRING,
        allowNull: false
    }
});

export default TripID;