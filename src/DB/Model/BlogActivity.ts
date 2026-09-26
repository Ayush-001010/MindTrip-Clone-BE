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
        allowNull: false
    },
    placeName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    activityType: {
        type: DataTypes.STRING,
        allowNull: false
    },
    time: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    tips: {
        type: DataTypes.JSON,
        allowNull: false
    },
    coordinates: {
        type: DataTypes.JSON,
        allowNull: false
    },
    images: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    sideActivities: {
        type: DataTypes.JSON,
        allowNull: false
    },
    amountSpent: {
        type: DataTypes.FLOAT,
        allowNull: false
    }
});

export default BlogActivity;