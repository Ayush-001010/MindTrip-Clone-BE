import sequelize from "../dbConfig";
import { DataTypes } from "sequelize";

const BlogLikeByUser = sequelize.define("BlogLikeByUser", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    blogId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

export default BlogLikeByUser;