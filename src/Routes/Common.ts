import { Router } from "express";
import { activitesValidation, getPlaceImageValidation, someRandomImagesValidation } from "../Validation/CommonValidation";
import { someRandomImages , activites, fetchUserDetails , getPlaceImage, getMetaDataForBlog, getUploadedFileURL , fetchUserFollowing, fetchUserFriends, fetchUserFollowers, updateUserDetails, fetchUserPlaces, fetchUserBlogDetails, addUserDetails } from "../Controller/Common";
const route = Router();

route.get("/activites" , activitesValidation , activites);
route.get("/someRandomImages", someRandomImagesValidation, someRandomImages);
route.get("/getPlaceImage",getPlaceImageValidation,getPlaceImage);
route.get("/getMetaDataForBlog", getMetaDataForBlog);
route.post("/getUploadedFileURL", getUploadedFileURL);
route.get("/fetchUserFollowing", fetchUserFollowing);
route.get("/fetchUserFriends", fetchUserFriends);
route.get("/fetchUserDetails", fetchUserDetails);
route.get("/fetchUserFollowers", fetchUserFollowers);
route.post("/updateUserDetails", updateUserDetails);
route.get("/fetchUserPlaces", fetchUserPlaces);
route.get("/fetchUserBlogDetails", fetchUserBlogDetails);
route.post("/addUserDetails", addUserDetails);

export default route;