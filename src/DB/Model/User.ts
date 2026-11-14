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
        holidayDate:{
            type:DataTypes.STRING,
            allowNull: true,
        },
        birthdayDate:{
            type:DataTypes.DATE,
            allowNull: true,
        },
        anniversaryDate:{
            type:DataTypes.DATE,
            allowNull: true,
        },
        userImage:{
            type: DataTypes.STRING,
            allowNull: true,
        },
        numberOfTrips:{
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        numberOfBlogs:{
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        aboutMe:{
            type: DataTypes.STRING,
            allowNull: true,
        },
        interests:{
            type: DataTypes.STRING,
            allowNull: true,
        },
        location:{
            type: DataTypes.STRING,
            allowNull: true,
        },
        notifyNotes:{
            type: DataTypes.TEXT,
            allowNull: true,
        },
        genralAnswer:{
            type: DataTypes.STRING,
            allowNull: true,
        },
        totalNumberOfMemoriesLeft : {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 5,
        },
        memoriesMapping: {
            type: DataTypes.STRING,
            allowNull: true,
        }
    },
);

export default User;