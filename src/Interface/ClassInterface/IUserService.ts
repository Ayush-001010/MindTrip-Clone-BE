import IImportantDateRange from "../DataInterface/IImportantDateRange";

export default interface IUserService {
    fetchImportantDates(userID: string): Promise<{dateRange : IImportantDateRange[] , birthdayDate: Date, anniversaryDate: Date} | null>;
    fetchUserDetails(userID: string): Promise<{name: string, email: string} | null>;
}