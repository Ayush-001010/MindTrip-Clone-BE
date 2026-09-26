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
    }
});

export default Blog;