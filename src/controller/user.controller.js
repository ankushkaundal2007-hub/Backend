import asyncHandler from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiErrors.js"
import User from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"


const registerUser=asyncHandler(async(req,res)=>{
   // get the data from frontend
   // validate the data
   // check data is received or not.
   // check if user exists or not
   //check for avatar and coverImage:multer success
   // upload avatar or other files to cloudinary
   // make a database entry for given data
   // check success of entry
   // send in response the same data excluding password and refresh token
   const {username,email,FullName,password}=req.body;
    if([username,email,FullName,password].some((field)=>{
      field?.trim()==""
    })){
      throw new ApiError(404,"All fields are required")
    }
  const existingUser= await User.findOne({
   $or:[{email},{username}]
  })

  if(existingUser){
   throw new ApiError(404,"User already exists")
  }

  const avatarLocalPath= req.files?.avatar[0].path
  let coverImageLocalPath;
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
    coverImageLocalPath=req.files.coverImage[0].path
  }

  if(!avatarLocalPath){
   throw new ApiError(404,"Avatar is required")
  }

  const uploadAvatar=await uploadOnCloudinary(avatarLocalPath)
  const uploadCoverImage=await uploadOnCloudinary(coverImageLocalPath)

  if(!uploadAvatar){
   throw new ApiError(500,"Some error occurred while uploading files")
  }
const user = await User.create({
    username:username.toLowerCase(),
    email,
    FullName,
    avatar: uploadAvatar.url,
    coverImage:uploadCoverImage.url ||"",
    password,
});

 const createdUser=await User.findById(user._id).select(
   "-password -RefreshToken"
 )

 if(!createdUser){
   throw new ApiError(500,"something went wrong while registering User")
 }

 res.status(200).json(
  new ApiResponse(200,createdUser,"user registered successfully")
 )



    
})
const generateAccessAndRefreshTokens=async (userId) => {
    try {
      const user= await User.findById(userId)
      const AccessToken= user.generateAccessToken()
      const RefreshToken=user.generateRefreshToken()
      user.RefreshToken=RefreshToken
      await user.save({validateBeforeSave:false}) // if saved it will give error as required fields like password are not given so before save stop the validation
    
        return {AccessToken,RefreshToken}
      
    } catch (error) {
      throw new ApiError(500,"something went wrong while generating tokens")
    }
  
}
const loginUser=asyncHandler(async(req,res)=>{
    // email,username,password from frontend
    //check the frontend data
    //find the user in db and check
    // check password
    // generate access and refresh token ans store refresh in db
    // send access token via cookies to user
    const{username,email,password}=req.body
    if (!(username || email)) {
      throw new ApiError(404,"username or email is required");
      
    }
    const user= await User.findOne({
      $or:[{username},{email}]
    })

    if(!user){
      throw new ApiError(500,"user fetching failed");

    }
    const isPasswordValid=await user.isPasswordCorrect(password)  // here don't use ->User as this is model or schema methods work for the retrieved data so use -> user

    if(!isPasswordValid){
      throw new ApiError(400,"password is incorrect");
    }

      const{AccessToken,RefreshToken}=await generateAccessAndRefreshTokens(user._id);
      // the user used here is before calling this above function so this user doesn't have refresh token,
      // so we have two ways one we can add refresh token to it and save means update it or make a query again and fetch latest one

      const loggedInUser= await User.findById(user._id).
      select("-password -RefreshToken")

  const options={
    httpOnly:true,
    secure:true
  }

  return res
  .status(200)
  .cookie("AccessToken",AccessToken,options)
  .cookie("RefreshToken",RefreshToken,options)
  .json(
    new ApiResponse(200,{
      user:loggedInUser,AccessToken,RefreshToken
    },
  "User logged In successfully")
  )

})
const logoutUser=asyncHandler(async(req,res)=>{
  const user=req.user
  await User.findOneAndUpdate(user._id,
    {
    $set:{RefreshToken:undefined}
  },
    {
      new:true
    }
  )
 const options={
    httpOnly:true,
    secure:true
  }
  return res
  .status(200)
  .clearCookie("AccessToken",options)
  .clearCookie("RefreshToken",options)
  .json(new ApiResponse(200,"User logged out"))
})

const refreshAccessToken=asyncHandler(async(req,res)=>{
  const incomingRefreshToken= req.cookies.RefreshToken || req.body.RefreshToken
  if(!incomingRefreshToken){
    throw new ApiError(401,"unauthorized request");
  }

  try {
    const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
    const user=await User.findById(decodedToken?._id)
    if(!user){
      throw new ApiError(401,"invalid refresh token");
    }
    if(incomingRefreshToken !== user.RefreshToken){
      throw new ApiError(401,"invalid Token or Token expired");
    }

    const options={
      httpOnly:true,
      secure:true
    }
   const{newRefreshToken,newAccessToken}=await generateAccessAndRefreshTokens(user._id)
   return res
   .status(200)
   .cookie("AccessToken",newAccessToken,options)
   .cookie("RefreshToken",newRefreshToken,options)
   .json(
    new ApiResponse(200,{
      user:newAccessToken,newRefreshToken},
      "AccessToken is refreshed"

    )
   )
  } catch (error) {
    throw new ApiError(400,"invalid Token")
  }

})

export  {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken

}