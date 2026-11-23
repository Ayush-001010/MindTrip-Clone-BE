import sequelize from "../dbConfig";
import { DataTypes } from "sequelize";

const BlogActivity = sequelize.define("BlogActivity", {
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    day: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    placeName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    activityType: {
        type: DataTypes.STRING,
        allowNull: true
    },
    time: {
        type: DataTypes.STRING,
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    tips: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    coordinates: {
        type: DataTypes.STRING,
        allowNull: true
    },
    images: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    sideActivities: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    amountSpent: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    longitude: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    latitude: {
        type: DataTypes.FLOAT,
        allowNull: true
    }
});

export default BlogActivity;