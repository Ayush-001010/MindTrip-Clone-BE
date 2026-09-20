import sequelize from "../dbConfig";
import { DataTypes } from "sequelize";

const TripExpense = sequelize.define("TripExpense", {
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    tripID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    paidByUserID: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    paidByUserName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    totalAmount: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false
    },
    splitMethod: {
        type: DataTypes.ENUM("equal","percentage","custom", "ratio"),
        allowNull: false
    },
    notes: {
        type: DataTypes.STRING,
        allowNull: true
    },
    spendAt: {
        type: DataTypes.DATE,
        allowNull: false
    }
});

export default TripExpense;