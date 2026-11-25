import sequelize from "../dbConfig";
import { DataTypes } from "sequelize";

const MemoriesUserInvite = sequelize.define("MemoriesUserInvite", {
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userName:{
        type: DataTypes.STRING,
        allowNull: false
    },
    workId:{
        type: DataTypes.STRING,
        allowNull: false
    },
    base62:{
        type: DataTypes.STRING,
        allowNull: false
    },
    actionTaken:{
        type: DataTypes.BOOLEAN,
        allowNull: false
    }
});

export default MemoriesUserInvite;