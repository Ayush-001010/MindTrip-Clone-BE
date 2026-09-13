import sequelize from "../dbConfig";
import { DataTypes } from "sequelize";

const User = sequelize.define("User",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },

        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },

        password: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        googleId: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },
    },
);

export default User;