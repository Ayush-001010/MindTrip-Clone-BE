import IUserService from "../../Interface/ClassInterface/IUserService";
import IImportantDateRange from "../../Interface/DataInterface/IImportantDateRange";
import APIResponseInterface from "../../Interface/ResponseInterface/APIResponseInterface";
import DataBaseService from "../Database/Database";
import UserActivity from "../UserActivity/UserActivity";

export default class UserService implements IUserService {
  private dataBaseServiceInstance: DataBaseService;

  constructor() {
    this.dataBaseServiceInstance = new DataBaseService();
  }
  private parseDate(value: unknown): { day: number; month: number } | null {
    if (!value) return null;
  
    // Handle JavaScript Date objects
    if (value instanceof Date) {
      if (isNaN(value.getTime())) return null;
  
      return {
        day: value.getDate(),
        month: value.getMonth() + 1,
      };
    }
  
    if (typeof value !== "string") return null;
  
    const date = value.trim();
    if (!date) return null;
  
    let day: number;
    let month: number;
  
    // Frontend format: YYYY-MM-DD
    if (/^\d{4}-\d{1,2}-\d{1,2}/.test(date)) {
      const parts = date.split("-");
      month = Number(parts[1]);
      day = Number(parts[2].slice(0, 2));
    }
    // Existing format: DD-MM or DD-MM-YYYY
    else {
      const parts = date.split("-");
      day = Number(parts[0]);
      month = Number(parts[1]);
    }
  
    if (
      !Number.isInteger(day) ||
      !Number.isInteger(month) ||
      day < 1 ||
      day > 31 ||
      month < 1 ||
      month > 12
    ) {
      return null;
    }
  
    return { day, month };
  }
 
async fetchImportantDates(
  userID: string
): Promise<{
  dateRange: IImportantDateRange[];
  birthdayDate: Date | null;
  anniversaryDate: Date | null;
} | null> {
  try {
    const userDetails = await this.dataBaseServiceInstance.fetchData<any>(
      "User",
      undefined,
      undefined,
      { id: userID }
    );

    if (!userDetails.dataSuccess || !userDetails.data?.length) {
      throw new Error("FAILED_TO_FETCH_USER_DETAILS");
    }

    const user = userDetails.data[0];

    // Parse birthday and anniversary
    const birthDate = this.parseDate(user.birthdayDate);
    const anniversary = this.parseDate(user.anniversaryDate);

    // Parse holiday dates
    const holidayDate = user.holidayDate || "";
    const dateRange: IImportantDateRange[] = [];

    String(holidayDate)
      .split("|")
      .filter(Boolean)
      .forEach((date: string) => {
        const parsedDate = this.parseDate(date);

        if (parsedDate) {
          dateRange.push(parsedDate);
        }
      });

    const currentYear = new Date().getFullYear();

    const birthdayDate = birthDate
      ? new Date(currentYear, birthDate.month - 1, birthDate.day, 10, 0, 0)
      : null;

    const anniversaryDate = anniversary
      ? new Date(currentYear, anniversary.month - 1, anniversary.day, 10, 0, 0)
      : null;

    console.log("Birthday Date:", birthdayDate);
    console.log("Anniversary Date:", anniversaryDate);
    console.log("Holiday Date Range:", dateRange);

    return {
      dateRange,
      birthdayDate,
      anniversaryDate,
    };

  } catch (error) {
    console.error("Error fetching important dates:", error);
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

  async followUser(userID: string, followingUserID: string): Promise<APIResponseInterface<boolean>> {
    try{
      const userDetailsFollower = await this.dataBaseServiceInstance.fetchData<any>("User",undefined,undefined,
        {
          id: userID,
        },
      );
      const userDetailsFollowing = await this.dataBaseServiceInstance.fetchData<any>("User",undefined,undefined,
        {
          id: followingUserID,
        },
      );
      const response = await this.dataBaseServiceInstance.createData<any>("UserFollowing",{
        userId: userID,
        followingUserId: followingUserID,
        userName : userDetailsFollower.data?.[0]?.dataValues.name || "",
        followingUserName : userDetailsFollowing.data?.[0]?.dataValues.name || "",
      });
      if(response.dataSuccess){
        return { success: true, data: true };
      } else {
        return { success: false, data: false };
      }
    } catch (error) {
      console.error("Error following user: ", error);
      return { success: false, data: false };
    }
  }

  async likeBlog(userID: string, blogID: string): Promise<APIResponseInterface<boolean>> {
    try {
      const response = await this.dataBaseServiceInstance.createData<any>("BlogLikeByUser", {
        userId: userID,
        blogId: blogID,
      });
      if (response.dataSuccess) {
        return { success: true, data: true };
      } else {
        return { success: false, data: false };
      }
    } catch (error) {
      console.error("Error liking blog: ", error);
      return { success: false, data: false };
    }
  }

  async dislikeBlog(userID: string, blogID: string): Promise<APIResponseInterface<boolean>> {
    try {
      const response = await this.dataBaseServiceInstance.deleteData<any>("BlogLikeByUser", {
        userId: userID,
        blogId: blogID,
      });
      if (response.dataSuccess) {
        return { success: true, data: true };
      } else {
        return { success: false, data: false };
      }
    } catch (error) {
      console.error("Error disliking blog: ", error);
      return { success: false, data: false };
    }
  }

  async userLikedBlogs(userID: string): Promise<APIResponseInterface<string[]>> {
    try {
      const response = await this.dataBaseServiceInstance.fetchData<any>("BlogLikeByUser", undefined, undefined, {
        userId: userID,
      });
      if (response.dataSuccess) {
        const likedBlogs = response.data?.map((item: any) => item.dataValues.blogId) || [];
        return { success: true, data: likedBlogs };
      } else {
        return { success: false, data: [] };
      }
    } catch (error) {
      console.error("Error fetching user liked blogs: ", error);
      return { success: false, data: [] };
    }
  }
}
