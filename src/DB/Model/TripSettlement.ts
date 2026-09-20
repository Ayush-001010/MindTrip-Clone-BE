import sequelize from "../dbConfig";
import { DataTypes } from "sequelize";

const TripSettlement = sequelize.define("TripSettlement", {
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    tripID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fromUserID: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    fromUserName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    toUserID: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    toUserName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    amount: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    isSettled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
});

export default TripSettlement;