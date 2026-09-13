import { Models } from "../../DB/model";
import { IDatabaseResponse } from "../ResponseInterface/IDatabaseResponse";

export default interface IDataBaseService {
    fetchData<T>(tableName : keyof Models , limit?: number , skip?: number): Promise<IDatabaseResponse<T>>;
}