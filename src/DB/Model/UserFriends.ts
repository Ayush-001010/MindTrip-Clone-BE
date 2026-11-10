import sequelize from "../dbConfig";
import { DataTypes } from "sequelize";

const UserFriends = sequelize.define("UserFriends", {
    id : {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId : {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    friendId : {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    friendName : {
        type: DataTypes.STRING,
        allowNull: false
    },
    status:{
        type:DataTypes.ENUM("Friend","Pending","Reject"),
        allowNull: false
    }
});


export default UserFriends;