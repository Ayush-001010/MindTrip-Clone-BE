import sequelize from "../dbConfig";
import { DataTypes } from "sequelize";

const CheckIns = sequelize.define("CheckIns", {
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userMember:{
        type: DataTypes.STRING,
        allowNull: false
    },
    status:{
        type: DataTypes.ENUM("Reached" , "Not Reached Yet"),
        allowNull: false
    },
    ReachWhen:{
        type: DataTypes.STRING,
        allowNull: true
    }
});

export default CheckIns;