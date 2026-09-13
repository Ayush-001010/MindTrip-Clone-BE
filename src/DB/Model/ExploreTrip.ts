import sequelize from "../dbConfig";
import { DataTypes } from "sequelize";


const ExploreTrip = sequelize.define("ExploreTrip", {
    id : {
        primaryKey : true,
        type : DataTypes.INTEGER,
        autoIncrement : true
    },
    title:{
        type : DataTypes.STRING,
        allowNull : false
    },
    description : {
        type : DataTypes.STRING,
        allowNull : false
    },
    image : {
        type : DataTypes.STRING,
        allowNull : false
    },
});

export default ExploreTrip;