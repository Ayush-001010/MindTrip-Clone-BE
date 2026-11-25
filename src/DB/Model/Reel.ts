import sequelize from "../dbConfig";
import { DataTypes } from "sequelize";

const Reel = sequelize.define("Reel", {
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    script:{
        type: DataTypes.TEXT,
        allowNull: true
    },
    placeNames:{
        type: DataTypes.STRING,
        allowNull: true
    },
    videoKey:{
        type: DataTypes.STRING,
        allowNull: true
    },
    blogId:{
        type: DataTypes.INTEGER,
        allowNull: true
    },
    blogTitle:{
        type: DataTypes.STRING,
        allowNull: true
    },
    blogDescription:{
        type: DataTypes.TEXT,
        allowNull: true
    },
    userName:{
        type: DataTypes.STRING,
        allowNull: false
    },
    userId:{
        type: DataTypes.STRING,
        allowNull: false
    }
});

export default Reel;