import sequelize from "../dbConfig";
import { DataTypes } from "sequelize";

const UserFollowing = sequelize.define("UserFollowing", {
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId : {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    userName : {
        type: DataTypes.STRING,
        allowNull: false
    },
    followingUserId : {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    followingUserName : {
        type: DataTypes.STRING,
        allowNull: false
    }
});

export default UserFollowing;