import models, { Models } from "../../DB/model";
import IDataBaseService from "../../Interface/ClassInterface/IDataBaseService";
import { IDatabaseResponse } from "../../Interface/ResponseInterface/IDatabaseResponse";

export default class DataBaseService implements IDataBaseService {
  fetchData = async <T>(tableName: keyof Models, limit?: number, skip?: number,where?:any,order?:any): Promise<IDatabaseResponse<T>> => {
    try {
      console.log(`Fetching data from table: ${tableName} with limit: ${limit} and skip: ${skip}`);
      const response = await models[tableName].findAll({ limit, offset: skip, where, order });
      return { dataSuccess: true , data: response as T}
    } catch (error) {
        return { dataSuccess: false, data: null };
    }
  };
  createData = async<T>(tableName: keyof Models, data: T): Promise<IDatabaseResponse<T>> => {
    try {
      console.log(`Creating data in table: ${tableName}`);
      const response = await models[tableName].create(data as any);
      return { dataSuccess: true, data: response as T };
    } catch (error) {
        return { dataSuccess: false, data: null };
    }
  };
  updateData = async<T>(tableName: keyof Models, data: Partial<T>, condition: object): Promise<IDatabaseResponse<T>> => {
    try {
      console.log(`Updating data in table: ${tableName} with condition: ${JSON.stringify(condition)}`);
      await models[tableName].update(data as any, { where: condition as any, returning: true });
      return { dataSuccess: true, data: null };
    } catch (error) {
        console.log(`Error updating data in table: ${tableName}`, error);
        return { dataSuccess: false, data: null };
    }
  };
}
