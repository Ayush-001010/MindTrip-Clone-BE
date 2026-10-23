import sequelize from "../dbConfig";
import { DataTypes } from "sequelize";

const PollOption = sequelize.define("PollOption", {
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
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

export default PollOption;