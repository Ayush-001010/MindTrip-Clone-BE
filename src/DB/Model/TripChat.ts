import sequelize from "../dbConfig";
import { DataTypes } from "sequelize";


const TripChat = sequelize.define("TripChat", {
    id : {
        primaryKey : true,
        type : DataTypes.INTEGER,
        autoIncrement : true
    },
    userID:{
        type : DataTypes.STRING,
        allowNull : false
    },
    tripID : {
        type : DataTypes.STRING,
        allowNull : false
    },
    message : {
        type : DataTypes.STRING,
        allowNull : false
    },
    response : {
        type : DataTypes.STRING,
        allowNull : false
    },
    messageDate : {
        type : DataTypes.DATE,
        allowNull : false
    },
});

export default TripChat;