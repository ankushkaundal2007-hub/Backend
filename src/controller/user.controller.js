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

const changeCurrentPassword=asyncHandler(async(req,res)=>{
     //get old and new password from user
     // check the data is received or not
     // now use jwt cookie to find the user in db
     // then save new password
     const{oldPassword,newPassword}=req.body
     if([oldPassword,newPassword].some((field)=>{
      field.trim()==""
     })){
      throw new ApiError(404,"Password is required")
     }

     const user = await User.findById(req.user?._id);
     if(!user){
      throw new ApiError(500,"failed to find user");
     }
     
    user.password=newPassword;
    await user.save({validateBeforeSave:false});
    return res
    .status(200)
    .json( new ApiResponse(
      200,
      {},
      "password changed successfully"
    ))

})


const getCurrentUser=asyncHandler(async(req,res)=>{
  const user=req.user
  return res
  .status(200)
  .json(new ApiResponse(
    200,
    {user:user},
    "user data sent successfully"
  ))
})



const updateFileAvatar=asyncHandler(async(req,res)=>{
  //first verify jwt whether user is logged in then only go ahead,use middleware
  //multer upload
  // check file received or not 
  //upload on cloudinary
  //save in db
  const avatarLocalPath=req.file?.path;
  if(!avatarLocalPath){
    throw new ApiError(404,"file not uploaded");
  }

  const uploadedNewAvatar= await uploadOnCloudinary(avatarLocalPath);
  if(!uploadedNewAvatar){
    throw new ApiError(500,"file upload on cloudinary failed");
  }
  const user=await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar:uploadedNewAvatar.url
      }
    },
    {
      new:true
    }
  ).select("-password")

  res
  .status(200)
  .json(new ApiResponse(
    200,
    {},
    "avatar updated successfully"
  ))

})


const updateFileCoverImage=asyncHandler(async(req,res)=>{
  //first verify jwt whether user is logged in then only go ahead,use middleware
  //multer upload
  // check file received or not 
  //upload on cloudinary
  //save in db
  const coverImageLocalPath=req.file?.path;
  if(!coverImageLocalPath){
    throw new ApiError(404,"file not uploaded");
  }

  const uploadedNewCoverImage= await uploadOnCloudinary(coverImageLocalPath);
  if(!uploadedNewCoverImage){
    throw new ApiError(500,"file upload on cloudinary failed");
  }
  const user=await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar:uploadedNewCoverImage.url
      }
    },
    {
      new:true
    }
  ).select("-password")

  res
  .status(200)
  .json(new ApiResponse(
    200,
    {},
    "CoverImage updated successfully"
  ))

})

const getChannelSubscribers=asyncHandler(async (req,res) => {
    //user searches channel username we send it in url through frontend
    const username=req.params;
    if(!username){
      throw new ApiError(400,"username is missing");
    }

   const channel= await User.aggregate({
      $match:{
        username:username
      }
    },
  {
    $lookup:{
      from:"subscribers" ,// actually model name is Subscriber but in db it si saved as subscribers
       localField:"_id",
       foreignField:"channel" ,
       result:"SubscribersCount"        // this pipeline is for counting no of subscribers as for subscriber count docs with channel name
    }
    
  },
{
  $lookup:{
    from:"subscribers",
    localField:"_id",
    foreignField:"subscriber",
    result:"subscribedTo"
  }
},
{
  $addFields:{
      subscriberCount:{
        $size:"$subscribers"
      },
      SubscribedToCount:{
        $size:"$subscribedTo"
      },
      isSubscribedToGivenUsernameChannel:{
        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
        then:true,
        else:false
      }
  }
},
{
  $project:{                     // it is used to decide what to send and show like what u want to send and show flag it as 1;
     username:1,
     subscriberCount:1,
     SubscribedToCount:1,
     isSubscribedToGivenUsernameChannel:1,
     avatar:1,
     coverImage:1,
     FullName:1
  }
})

// console.log(channel)
if(!channel?.length()){
  throw new ApiError(400,"channel not found")
}

return res
.status(200)
.json(new ApiResponse(200,channel[0],"channel fetched successfully"))
})


export  {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateFileAvatar,
  updateFileCoverImage,
  getChannelSubscribers


}