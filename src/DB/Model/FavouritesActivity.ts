import sequelize from "../dbConfig";
import { DataTypes } from "sequelize";

const FavouritesActivity = sequelize.define("FavouritesActivity", {
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    type:{
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Activity"
    },
    placeName:{
        type: DataTypes.STRING,
        allowNull: false
    },
    activityImage:{
        type: DataTypes.STRING,
        allowNull: false
    },
    activityName:{
        type: DataTypes.STRING,
        allowNull: false
    },
    activityAddress:{
        type: DataTypes.STRING,
        allowNull: false
    },
    activityDescription:{
        type: DataTypes.STRING,
        allowNull: false
    },
    rating:{
        type: DataTypes.FLOAT,
        allowNull: false
    },
    reviews:{
        type: DataTypes.INTEGER,
        allowNull: false
    },
    longitude:{
        type: DataTypes.FLOAT,
        allowNull: false
    },
    latitude:{
        type: DataTypes.FLOAT,
        allowNull: false
    }
});

export default FavouritesActivity;