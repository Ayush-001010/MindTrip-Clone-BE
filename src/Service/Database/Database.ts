import { col, fn, Op } from "sequelize";
import models, { Models } from "../../DB/model";
import IDataBaseService from "../../Interface/ClassInterface/IDataBaseService";
import { IDatabaseResponse } from "../../Interface/ResponseInterface/IDatabaseResponse";

export default class DataBaseService implements IDataBaseService {
  fetchData = async <T>(tableName: keyof Models, limit?: number, skip?: number,where?:any,order?:any): Promise<IDatabaseResponse<T>> => {
    try {
      // console.log(`Fetching data from table: ${tableName} with limit: ${limit} and skip: ${skip}`);
      const response = await models[tableName].findAll({ limit, offset: skip, where, order });
      return { dataSuccess: true , data: response as T}
    } catch (error) {
      console.error(`Error fetching data from table: ${tableName}`, error);
        return { dataSuccess: false, data: null };
    }
  };

  fetchDataWhereIn = async<T>(tableName: keyof Models, column: keyof T, between: any[]): Promise<IDatabaseResponse<T>> => {
    try {
      const response = await models[tableName].findAll({
        where: {
          [column as string]: { [Op.in]: between }
        }
      });
      return { dataSuccess: true, data: response as T };
    } catch (error) {
      console.error(`Error fetching data between in table: ${tableName}`, error);
      return { dataSuccess: false, data: null };
    }
  };

  createData = async<T>(tableName: keyof Models, data: T): Promise<IDatabaseResponse<T>> => {
    try {
      // console.log(`Creating data in table: ${tableName}`);
      const response = await models[tableName].create(data as any);
      return { dataSuccess: true, data: response as T };
    } catch (error) {
        console.error(`Error creating data in table: ${tableName}`, error);
        return { dataSuccess: false, data: null };
    }
  };

  updateData = async<T>(tableName: keyof Models, data: Partial<T>, condition: object): Promise<IDatabaseResponse<T>> => {
    try {
      // console.log(`Updating data in table: ${tableName} with condition: ${JSON.stringify(condition)}`);
      const response = await models[tableName].update(data as any, { where: condition as any, returning: true });
      return { dataSuccess: true, data: response as T };
    } catch (error) {
        console.log(`Error updating data in table: ${tableName}`, error);
        return { dataSuccess: false, data: null };
    }
  };

  countData = async<T>(tableName: keyof Models, condition?: Partial<T>): Promise<IDatabaseResponse<number>> => {
    try {
      const response = await models[tableName].count({ where: condition as any });
      return { dataSuccess: true, data: response };
    } catch (error) {
        console.log(`Error counting data in table: ${tableName}`, error);
        return { dataSuccess: false, data: null };
    }
  };

  deleteData = async<T>(tableName: keyof Models, condition?: Partial<T>): Promise<IDatabaseResponse<T>> => {
    try {
      const response = await models[tableName].destroy({ where: condition as any });
      return { dataSuccess: true, data: response as T };
    } catch (error) {
        console.log(`Error deleting data in table: ${tableName}`, error);
        return { dataSuccess: false, data: null };
    }
  };

  specialQuery = async<T>(type: "mostLikedLastSevenDays" | "mostLikedLastTwoHours" | "mostDislikedLastSevenDays" | "mostDislikedLastTwoHours"): Promise<IDatabaseResponse<T>> => {
    try{
      switch(type){
        case "mostLikedLastSevenDays":
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          const likes = await models["UserActivity"].findAll({
            attributes: [
              "blogId",
              [fn("COUNT", col("*")), "likeCount"],
            ],
            where: { 
              activity: "like",
              createdAt: { [Op.gt]: sevenDaysAgo }, 
            },
            group: ["blogId"],
            raw: true,
          });
          return { dataSuccess: true, data: likes as unknown as T };
        case "mostLikedLastTwoHours":
          const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
          console.log("Two hours ago:", twoHoursAgo);
          const likesTwoHours = await models["UserActivity"].findAll({
            attributes: [
              "blogId",
              [fn("COUNT", col("*")), "likeCount"],
            ],
            where: { 
              activity: "like",
              createdAt: { [Op.gt]: twoHoursAgo }, 
            },
            group: ["blogId"],
            raw: true,
          });
          if(!likesTwoHours || likesTwoHours.length === 0){
            return { dataSuccess: true, data: [] as unknown as T };
          }
          return { dataSuccess: true, data: likesTwoHours as unknown as T };
          case "mostDislikedLastSevenDays":
            const sevenDaysAgoDislike = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const dislikes = await models["UserActivity"].findAll({
              attributes: [
                "blogId",
                [fn("COUNT", col("*")), "dislikeCount"],
              ],
              where: { 
                activity: "dislike",
                createdAt: { [Op.gt]: sevenDaysAgoDislike }, 
              },
              group: ["blogId"],
              raw: true,
            });
            return { dataSuccess: true, data: dislikes as unknown as T };
          case "mostDislikedLastTwoHours":
            const twoHoursAgoDislike = new Date(Date.now() - 2 * 60 * 60 * 1000);
            const dislikesTwoHours = await models["UserActivity"].findAll({
              attributes: [
                "blogId",
                [fn("COUNT", col("*")), "dislikeCount"],
              ],
              where: { 
                activity: "dislike",
                createdAt: { [Op.gt]: twoHoursAgoDislike }, 
              },
              group: ["blogId"],
              raw: true,
            });
            if(!dislikesTwoHours || dislikesTwoHours.length === 0){
              return { dataSuccess: true, data: [] as unknown as T };
            }
            return { dataSuccess: true, data: dislikesTwoHours as unknown as T };
        }
    } catch (error) {
        console.log(`Error executing special query: ${type}`, error);
        return { dataSuccess: false, data: null };
    }
  }
}
