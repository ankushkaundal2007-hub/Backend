import { Router } from "express";
import registerUser from "../controller/user.controller.js";

const userRouter=Router();

userRouter.route("/register").post(registerUser);
//http://localhost:3000/api/users/register
export default userRouter;
