import sequelize from "../dbConfig";
import { DataTypes } from "sequelize";

const ReelAnalysicBatch = sequelize.define("ReelAnalysicBatch", {
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    memoryId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    tagName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status:{
        type: DataTypes.ENUM("pending","completed","failed"),
        allowNull: false,
        defaultValue: "pending"
    }
});

export default ReelAnalysicBatch;