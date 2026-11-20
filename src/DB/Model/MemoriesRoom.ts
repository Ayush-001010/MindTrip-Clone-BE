import sequelize from "../dbConfig";
import { DataTypes } from "sequelize";

const MemoriesRoom = sequelize.define("MemoriesRoom", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    memoryId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

export default MemoriesRoom;