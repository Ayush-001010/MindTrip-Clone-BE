import { Models } from "../../DB/model";
import { IDatabaseResponse } from "../ResponseInterface/IDatabaseResponse";

export default interface IDataBaseService {
    fetchData<T>(tableName : keyof Models , limit?: number , skip?: number, filter?: Partial<T>): Promise<IDatabaseResponse<T>>;
    createData<T>(tableName : keyof Models , data: T): Promise<IDatabaseResponse<T>>;
    updateData<T>(tableName : keyof Models , data: Partial<T>, filter?: Partial<T>): Promise<IDatabaseResponse<T>>;
    countData<T>(tableName : keyof Models , filter?: Partial<T>): Promise<IDatabaseResponse<number>>;
}