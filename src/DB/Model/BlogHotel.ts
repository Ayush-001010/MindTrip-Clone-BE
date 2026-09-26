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
        allowNull: false
    },
    checkInDate: {
        type: DataTypes.STRING,
        allowNull: false
    },
    checkOutDate: {
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

export default BlogHotel;