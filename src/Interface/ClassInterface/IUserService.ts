import IImportantDateRange from "../DataInterface/IImportantDateRange";

export default interface IUserService {
    fetchImportantDates(userID: string): Promise<{dateRange : IImportantDateRange[] , birthdayDate: Date, anniversaryDate: Date} | null>;
}