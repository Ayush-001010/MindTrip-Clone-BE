import { DataTypes, Model } from "sequelize";
import sequelize from "../dbConfig";

const UserTripMappingTable = sequelize.define("UserTripMappingTable", {
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    }
});

export default UserTripMappingTable;