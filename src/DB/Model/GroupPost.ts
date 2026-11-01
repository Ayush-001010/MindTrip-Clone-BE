import sequelize from "../dbConfig";
import { DataTypes } from "sequelize";

const GroupPost = sequelize.define("GroupPost", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    base62: {
        type: DataTypes.STRING,
        allowNull: false
    },
    authorUserId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    authorUserName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type:{
        type: DataTypes.ENUM("announcement","medical-emergency","poll","opinion","check-ins"),
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    }
});

export default GroupPost;