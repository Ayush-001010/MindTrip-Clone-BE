import sequelize from "../dbConfig";
import { DataTypes } from "sequelize";

const MemoriesChats = sequelize.define("MemoriesChats" , {
    id : {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    memoryId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    userMessage: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    botMessage: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    actionType:{
        type: DataTypes.ENUM("Start" , "Other"),
        allowNull: false,
        defaultValue: "Other"
    },
    userName : {
        type: DataTypes.STRING,
        allowNull: false
    }
});

export default MemoriesChats;