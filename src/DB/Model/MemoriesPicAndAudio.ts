import sequelize from "../dbConfig";
import { DataTypes } from "sequelize";

const MemoriesPicAndAudio = sequelize.define("MemoriesPicAndAudio", {
    id : {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    memoryId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM("pic" , "video", "audio"),
        allowNull: false
    },
    url: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    tag:{
        type: DataTypes.STRING,
        allowNull: true
    },
    isProcessed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    analysisResult: {
        type: DataTypes.TEXT,
        allowNull: true
    }
});

export default MemoriesPicAndAudio;