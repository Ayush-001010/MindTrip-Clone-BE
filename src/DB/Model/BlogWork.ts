import sequelize from "../dbConfig";
import { DataTypes } from "sequelize";

const BlogWork = sequelize.define("BlogWork",{
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId:{
        type: DataTypes.STRING,
        allowNull: false
    },
    blogId:{
        type: DataTypes.INTEGER,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

export default BlogWork;