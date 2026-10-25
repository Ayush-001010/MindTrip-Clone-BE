import sequelize from "../dbConfig";
import { DataTypes } from "sequelize";

const Opinion = sequelize.define("Opinion", {
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    imageUrl: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

export default Opinion;