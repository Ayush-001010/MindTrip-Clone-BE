import sequelize from "../dbConfig";
import { DataTypes } from "sequelize";

const TripExpenseShare = sequelize.define("TripExpenseShare", {
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    tripExpenseID: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    userID: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    userName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    shareType: {
        type: DataTypes.ENUM("equal","percentage","custom", "ratio"),
        allowNull: false
    },
    ownedAmount: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    isSettled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
});

export default TripExpenseShare;