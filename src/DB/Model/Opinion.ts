import sequelize from "../dbConfig";
import { DataTypes } from "sequelize";

const Opinion = sequelize.define("Opinion", {
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    imageUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    likeCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    disLikeCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
});

export default Opinion;