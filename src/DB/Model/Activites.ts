import sequelize from "../dbConfig";
import { DataTypes } from "sequelize";


const Activities = sequelize.define("Activities", {
    id : {
        primaryKey : true,
        type : DataTypes.INTEGER,
        autoIncrement : true
    },
    activityName : {
        type : DataTypes.STRING,
        allowNull : false
    },
    imageKey : {
        type : DataTypes.STRING,
        allowNull : false
    }
});

export default Activities;