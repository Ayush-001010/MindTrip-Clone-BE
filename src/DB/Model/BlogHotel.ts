import sequelize from "../dbConfig";
import { DataTypes } from "sequelize";

const BlogHotel = sequelize.define("BlogHotel", {
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    hotelName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    checkInDate: {
        type: DataTypes.STRING,
        allowNull: true
    },
    checkOutDate: {
        type: DataTypes.STRING,
        allowNull: true
    },
    amountSpent: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    }
});

export default BlogHotel;