import { Router } from "express";
import { followUser, userActivity, likeBlog, dislikeBlog, userLikedBlogs, fetchUserFriendsDetails, searchUserProfile, addFriend, takeActionOnFriendRequest, countTotalNumberOfMemoriesLeft } from "../Controller/UserController";
const router = Router();

router.post("/follow", followUser);
router.post("/activity", userActivity);
router.post("/like", likeBlog);
router.post("/dislike", dislikeBlog);
router.get("/liked-blogs", userLikedBlogs);
router.get("/friends", fetchUserFriendsDetails);
router.get("/search", searchUserProfile);
router.post("/add-friend", addFriend);
router.post("/take-action-on-friend-request", takeActionOnFriendRequest);
router.get("/count-memories-left", countTotalNumberOfMemoriesLeft);


export default router;