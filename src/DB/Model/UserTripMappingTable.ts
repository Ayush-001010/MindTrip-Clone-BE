import sequelize from "../dbConfig";

import { DataTypes } from "sequelize";

const UserTripMappingTable = sequelize.define("UserTripMappingTable", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    userId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    tripDetailsId: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
});

export default UserTripMappingTable;