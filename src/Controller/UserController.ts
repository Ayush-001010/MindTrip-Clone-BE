import {Request, Response} from "express";
import UserService from "../Service/User/UserService";
import UserActivity from "../Service/UserActivity/UserActivity";

export const followUser = async (req: Request, res: Response) => {
  const { userID, followingUserID } = req.body;
  try {
    const userService = new UserService();
    const response = await userService.followUser(userID, followingUserID);
    res.json(response);
  } catch (error) {
    console.error("Error in followUser controller: ", error);
    res.status(500).json({ success: false, data: false });
  }
};

export const userActivity = async (req: Request, res: Response) => {
  const { userID, activity, blogId, place } = req.body;
  try {
    const userActivityService = new UserActivity();
    const response = await userActivityService.createActivity(userID, activity, blogId, place);
    res.send(response);
  } catch (error) {
    console.error("Error in userActivity controller: ", error);
    res.status(500).json({ success: false, data: false });
  }
};

export const likeBlog = async (req: Request, res: Response) => {
  const { userID, blogID } = req.body;
  try {
    const userService = new UserService();
    const response = await userService.likeBlog(userID, blogID);
    res.json(response);
  } catch (error) {
    console.error("Error in likeBlog controller: ", error);
    res.status(500).json({ success: false, data: false });
  }
};

export const dislikeBlog = async (req: Request, res: Response) => {
  const { userID, blogID } = req.body;
  try {
    const userService = new UserService();
    const response = await userService.dislikeBlog(userID, blogID);
    res.json(response);
  } catch (error) {
    console.error("Error in dislikeBlog controller: ", error);
    res.status(500).json({ success: false, data: false });
  }
};

export const userLikedBlogs = async (req: Request, res: Response) => {
  const { userID } = req.query as { userID: string };
  try {
    const userService = new UserService();
    const response = await userService.userLikedBlogs(userID);
    res.json(response);
  } catch (error) {
    console.error("Error in userLikedBlogs controller: ", error);
    res.status(500).json({ success: false, data: [] });
  }
};

export const fetchUserFriendsDetails = async (req: Request, res: Response) => {
  const { userId } = req.query as { userId: string };
  try {
    const userService = new UserService();
    const response = await userService.fetchUserFriendsDetails(userId);
    res.json(response);
  } catch (error) {
    console.error("Error in fetchUserFriendsDetails controller: ", error);
    res.status(500).json({ success: false, data: { friendDetails: [], pendingFriendRequests: [] } });
  }
};

export const searchUserProfile = async (req: Request, res: Response) => {
  const { searchName , userId } = req.query as { searchName: string , userId: string };
  try {
    const userService = new UserService();
    const response = await userService.searchUserProfile(searchName, userId);
    res.json(response);
  } catch (error) {
    console.error("Error in searchUserProfile controller: ", error);
    res.status(500).json({ success: false, data: [] });
  }
};

export const addFriend = async (req: Request, res: Response) => {
  const { userID, friendID } = req.body;
  try {
    const userService = new UserService();
    const response = await userService.addFriend(userID, friendID);
    res.json(response);
  } catch (error) {
    console.error("Error in addFriend controller: ", error);
    res.status(500).json({ success: false, data: false });
  }
};

export const takeActionOnFriendRequest = async (req: Request, res: Response) => {
  const { userID, friendID, action } = req.body;
  try {
    const userService = new UserService();
    const response = await userService.takeActionOnFriendRequest(userID, friendID, action);
    res.json(response);
  } catch (error) {
    console.error("Error in takeActionOnFriendRequest controller: ", error);
    res.status(500).json({ success: false, data: false });
  }
};
