import IUserService from "../../Interface/ClassInterface/IUserService";
import IImportantDateRange from "../../Interface/DataInterface/IImportantDateRange";
import DataBaseService from "../Database/Database";

export default class UserService implements IUserService {
  private dataBaseServiceInstance: DataBaseService;

  constructor() {
    this.dataBaseServiceInstance = new DataBaseService();
  }

  async fetchImportantDates(userID: string): Promise<{dateRange : IImportantDateRange[] , birthdayDate: Date, anniversaryDate: Date} | null> {
    try {
      const userDetails = await this.dataBaseServiceInstance.fetchData<any>("User",undefined,undefined,
        {
          id: userID,
        },
      );
      if (userDetails.dataSuccess && userDetails.data) {
        const holidayDate = (userDetails.data?.[0]?.holidayDate || "").split(
          "|",
        );
        // console.log("Holiday Dates: ", holidayDate);
        const birthDate = (userDetails.data?.[0]?.birthdayDate ||
          "") as String;
        console.log("Birthday Date: ", birthDate);
        const anniversaryDate = (userDetails.data?.[0]?.anniversaryDate ||
          "") as String;
        // console.log("Anniversary Date: ", anniversaryDate);
        const dateRange: IImportantDateRange[] = [];
        holidayDate.forEach((date: string) => {
          const [day, month] = date.split("-").map(Number);
          if (!isNaN(day) && !isNaN(month)) {
            dateRange.push({ day, month });
          }
        });
        console.log("Date Range: ", dateRange);
        return { dateRange, birthdayDate: new Date((new Date()).getFullYear(), birthDate.split("-").map(Number)[1] - 1, birthDate.split("-").map(Number)[2], 10, 0, 0), anniversaryDate : new Date((new Date()).getFullYear(), anniversaryDate.split("-").map(Number)[1] - 1, anniversaryDate.split("-").map(Number)[2], 10, 0, 0) };
      } else {
        throw new Error("FAILED_TO_FETCH_USER_DETAILS");
      }
    } catch (error) {
      console.error("Error fetching important dates: ", error);
      return null;
    }
  }
  async fetchUserDetails(userID: string): Promise<{name: string, email: string} | null> {
    try {
      const userDetails = await this.dataBaseServiceInstance.fetchData<any>("User",undefined,undefined,
        {
          id: userID,
        },
      );
      if (userDetails.dataSuccess && userDetails.data) {
        const name = userDetails.data?.[0]?.dataValues.name || "";
        const email = userDetails.data?.[0]?.dataValues.email || "";
        return { name, email };
      } else {
        throw new Error("FAILED_TO_FETCH_USER_DETAILS");
      }
    } catch (error) {
      console.error("Error fetching user details: ", error);
      return null;
    }
  }
}
