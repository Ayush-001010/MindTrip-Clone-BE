import sequelize from "../dbConfig";
import { DataTypes } from "sequelize";

const OpinionComment = sequelize.define("OpinionComment", {
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    comment: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    parentCommentId: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
});

export default OpinionComment;