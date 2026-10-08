import sequelize from "../dbConfig";
import { DataTypes } from "sequelize";

const FavouritesBlog = sequelize.define("FavouritesBlog", {
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    blogID: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    blogTitle: {
        type: DataTypes.STRING,
        allowNull: false
    },
    blogImage: {
        type: DataTypes.STRING,
        allowNull: false
    },
    blogDescription: {
        type: DataTypes.STRING,
        allowNull: false
    },
    rating: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    reviews: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

export default FavouritesBlog;