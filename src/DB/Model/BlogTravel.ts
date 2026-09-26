import sequelize from "../dbConfig";
import { DataTypes } from "sequelize";

const BlogTravel = sequelize.define("BlogTravel", {
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    time: {
        type: DataTypes.STRING,
        allowNull: false
    },
    activityNumber: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    day: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    travelType: {
        type: DataTypes.STRING,
        allowNull: false
    },
    amountSpent: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    }
});

export default BlogTravel;