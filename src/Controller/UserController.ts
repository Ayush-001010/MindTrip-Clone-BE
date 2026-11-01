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