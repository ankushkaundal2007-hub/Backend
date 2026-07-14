import {ApiError} from "../utils/ApiErrors.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import User from "../models/user.model.js";


// we made this to get the user data when asked for logout as while logout twe need to remove refresh token but for that i need some parameters
// like email,username,id to fin din db and delete refresh token for this when we added access token during login we can use it to get user data
//  and use it to get user and remove it
//  this function gets that user data from cookie and then send in request further to logout handler and then done

 const verifyJWT=asyncHandler(async(req,res,next)=>{
    try {
        const Token=req.cookies?.AccessToken || req.header("Authorization")?.replace("Bearer ","");
        if(!Token){
            throw new ApiError(400,"invalid access token")
        }
        const decodedToken= jwt.verify(Token,process.env.ACCESS_TOKEN_SECRET)  // only the person with access token secret can decode it
          const user=await User.findById(decodedToken._id)
          req.user=user // add the user data 
          next()
          } catch (error) {
        throw new ApiError(400,"invalid Access Token")
    }
})

export {verifyJWT}