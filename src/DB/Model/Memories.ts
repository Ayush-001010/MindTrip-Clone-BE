import sequelize from "../dbConfig";
import { DataTypes } from "sequelize";

const Memories = sequelize.define("Memories" , {
    id: {
        type:DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    createdBy : {
        type: DataTypes.STRING,
        allowNull: false
    },
    place: {
        type: DataTypes.STRING,
        allowNull: true
    },
    totalCreditLeft: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1000
    },
    numberOfPeopleWorkingCurrently: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    progress:{
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    uiType: {
        type: DataTypes.ENUM("type1", "type2"),
        allowNull: false
    },
    userId : {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    workId : {
        type: DataTypes.STRING,
        allowNull: false
    }
});

export default Memories;