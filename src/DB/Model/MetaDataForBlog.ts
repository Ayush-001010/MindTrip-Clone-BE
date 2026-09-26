import sequelize from "../dbConfig";
import { DataTypes } from "sequelize";

const metaDataForBlog = sequelize.define("MetaDataForBlog", {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  value: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

export default metaDataForBlog;