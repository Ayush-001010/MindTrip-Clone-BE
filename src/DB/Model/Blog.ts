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
        allowNull: true
    },
    tripOverview: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    totalSpent: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    tripDuration: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    noOfPlaces: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    noOfActivities: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    bookingURL: {
        type: DataTypes.STRING,
        allowNull: true
    },
    profileImages: {
        type: DataTypes.STRING,
        allowNull: true
    },
    profileTitle: {
        type: DataTypes.STRING,
        allowNull: true
    },
    profileIcon: {
        type: DataTypes.STRING,
        allowNull: true
    },
    metaData: {
        type: DataTypes.STRING,
        allowNull: true
    },
    numberOfLikes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    userID: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isPublished: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
});

export default Blog;