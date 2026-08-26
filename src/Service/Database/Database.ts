import models, { Models } from "../../DB/model";
import IDataBaseService from "../../Interface/ClassInterface/IDataBaseService";
import { IDatabaseResponse } from "../../Interface/ResponseInterface/IDatabaseResponse";

export default class DataBaseService implements IDataBaseService {
  fetchData = async <T>(tableName: keyof Models, limit?: number, skip?: number): Promise<IDatabaseResponse<T>> => {
    try {
      const data = await models[tableName].findAll({ limit, offset: skip });
      return { dataSuccess: true, data: data as T };
    } catch (error) {
        return { dataSuccess: false, data: null };
    }
  };
}
