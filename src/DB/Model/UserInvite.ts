import sequelize from "../dbConfig";
import { DataTypes } from "sequelize";

const UserInvite = sequelize.define("UserInvite", {
    id:{
        type:DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    inviteURLID : {
        type:DataTypes.STRING,
        allowNull: false
    },
    base62:{
        type:DataTypes.STRING,
        allowNull: false
    },
    tripID:{
        type:DataTypes.STRING,
        allowNull: false
    },
    inviteUserBy:{
        type:DataTypes.STRING,
        allowNull: false
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
});

export default UserInvite;