import { Router } from "express";
import {registerUser,loginUser, logoutUser,refreshAccessToken, changeCurrentPassword} from "../controller/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import {verifyJWT} from "../middlewares/auth.middleware.js";

const userRouter=Router();

userRouter.route("/register").post( 
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 }
    ]),
    registerUser);
//http://localhost:3000/api/users/register
userRouter.route("/login").post(loginUser);
userRouter.route("/logout").post(verifyJWT,logoutUser)
userRouter.route("/refreshAccessToken").post(refreshAccessToken)
userRouter.route("/changePassword").post(verifyJWT,changeCurrentPassword)
export default userRouter;
