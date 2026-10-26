import sequelize from "../dbConfig";
import { DataTypes } from "sequelize";

const UserActivity = sequelize.define("UserActivity", {
    id : {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    activity: {
        type: DataTypes.ENUM("blog","place","dislike","like","search"),
        allowNull: false,
    },
    blogId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    place: {
        type: DataTypes.INTEGER,
        allowNull: true,
    }
});

export default UserActivity;