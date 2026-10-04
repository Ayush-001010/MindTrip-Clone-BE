import sequelize from "../dbConfig";
import { DataTypes } from "sequelize";

const Blog = sequelize.define("Blog", {
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    tripTitle: {
        type: DataTypes.STRING,
        allowNull: false
    },
    tripOverview: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    totalSpent: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    tripDuration: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    noOfPlaces: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    noOfActivities: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    bookingURL: {
        type: DataTypes.STRING,
        allowNull: false
    },
    profileImages: {
        type: DataTypes.STRING,
        allowNull: false
    },
    profileTitle: {
        type: DataTypes.STRING,
        allowNull: false
    },
    profileIcon: {
        type: DataTypes.STRING,
        allowNull: false
    },
    metaData: {
        type: DataTypes.STRING,
        allowNull: false
    },
    numberOfLikes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
});

export default Blog;