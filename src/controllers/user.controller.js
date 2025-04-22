import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
//so controllers are functions which are call when specific route path is call in route files.

//this method is used for loginuser method below
const generateAccessAndRefreshTokens = async (userId) => {
   const user =  await User.findOne(userId)
   const accessToken = user.generateAccessToken()
   const refreshToken = user.generateRefreshToken()

   user.refreshToken = refreshToken
   user.save({ validateBeforeSave:false })

   return { accessToken,refreshToken }
}

const registerUser = asyncHandler( async (req,res) => {

    //get user details from frontend
    //validation - not empty
    //check if user already exists: username ,email
    //check for images,check for avatar
    //upload them to cloudinary,avatar
    //create user object - create entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return res

    const { fullName, username, email, password } = req.body
    //check this in postman
  

   if(
    [fullName, email, username, password].some((field) => field === "")
   ) {
        throw new ApiError(400,"All Fields Are Required !")
     }
    
     const existedUser = await User.findOne({
               $or:[{ username }, { email }]
          })

     if(existedUser) {
          throw new ApiError(409,"User with this username and email already exists !")
     }

     // ??? req.files check this in console.log for knowledge. ????
   //   console.log(req.files);
   const avatarLocalPath = req.files?.avatar?.[0]?.path;
   // console.log(avatarLocalPath);
   const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
   // console.log(coverImageLocalPath);

   /*if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
     coverImageLocalPath = req.files.coverImage[0].path
   }
   */

   if(!avatarLocalPath){
     throw new ApiError(400,"AvatarFile Local Path is Required !") 
   }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!avatar) {
     throw new ApiError(400,"Avatar file is Required !")
  }

  const user = await User.create(
     {
          username: username.toLowerCase(),
          password,
          email,
          fullName,
          avatar: avatar.url,
          coverImage: coverImage?.url || ""
     });

  const createdUser =  await User.findById(user._id).select(
     "-password -refreshToken"
  )

  if(!createdUser) {
     throw new ApiError(500,"Somthing Went Wrong While Registering the user !")
  }

  return res.status(200).json(
     new ApiResponse(201,createdUser,"User Registered successfully"));

});

const loginUser = asyncHandler( async (req,res) => {

   /*req body -> data
   username or email
   find the user
   password check
   access and refresh token // separate new function for later use.
   send cookie */

   const { username, password } = req.body
   //data is not there
   // console.log("username: ",username)
   // console.log("email: ",email)
   // console.log("password: ",password)

   if(!username) {
      throw new ApiError(400,"username is required !");
   }

   const user =  await User.findOne({username})

   if(!user) {
      throw new ApiError(404,"User does not exist !"); 
   }

   const isPasswordValid = await user.isPasswordCorrect(password)
   // console.log( "Is password Valid or not: ",isPasswordValid);

   if(!isPasswordValid) {
      throw new ApiError(401,"password is Invalid");
   }

   const { accessToken , refreshToken } = await generateAccessAndRefreshTokens(user._id)

   const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
   )

   const options = {
      httpOnly:true,
      secure: true
   }

   return res
   .status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",refreshToken,options)
   .json(
      new ApiResponse(200,
         {
            user: loggedInUser, accessToken, refreshToken
         },
         "User logged In successfully"
      )
   )

});

const logoutUser = asyncHandler( async (req,res) => {

    await User.findByIdAndUpdate(
      req.user._id,
      {
         $set:{
            refreshToken:undefined
         }
      },
      {
         new:true
      }
   )

   const options = {
      httpOnly:true,
      secure:true
   }

   return res
   .status(200)
   .clearCookie("accessToken",options)
   .clearCookie("refreshToken",options)
   .json(
      new ApiResponse(200,{},"User logged Out !")
   )
   
});

 const refreshAccessToken = asyncHandler( async (req,res) => {

   const incomingToken = req.cookie?.refreshToken || req.body.refreshToken

   if(!incomingToken) {
      throw new ApiError(401,"unauthorized request");
   }

   try {
      const decodedToken = jwt.verify(incomingToken,process.env.REFRESH_TOKEN_SECRET)
      // console.log("decoded token: ",decodedToken)
   
      const user = await User.findById(decodedToken?._id)
      // console.log("decodedToken._id: ",decodedToken._id)
   
      if(!user) {
         throw new ApiError(401,"Invalid Refresh Token");
      }
   
      // console.log("incoming token: ",incomingToken,"user's token: ",user?.refreshToken)

      if(incomingToken !== user?.refreshToken){
         throw new ApiError(401,"Refresh Token is expired or used !")
      }
   
      const { accessToken , refreshToken } = await generateAccessAndRefreshTokens(user._id)
      // console.log("accessToken: ",accessToken)
      // console.log("newRefreshToken: ",newRefreshToken)
   
      const options = {
         httpOnly:true,
         secure:true
      }
   
      return res
      .status(200)
      .cookie("accessToken",accessToken,options)
      .cookie("refreshToken",refreshToken,options)
      .json(
         new ApiResponse(200,{
            accessToken, refreshToken
         },
         "Access Token Refresh successfully"
      )
      )
   } catch (error) {
      throw new ApiError(401,error?.message || "Invalid refresh token")
   }
 });

 const changeCurrentPassword = asyncHandler( async (req,res) => {
  const {oldPassword, newPassword} = req.body
   
  const user =  await User.findById(req.user?._id)

   const isPasswordCorrect = user.isPasswordCorrect(oldPassword)

   if(!isPasswordCorrect) {
      throw new ApiError(401,"Invalid old Password")
   }

   user.password = newPassword

   await user.save({validateBeforeSave:false})

   return res
   .status(200)
   .json(
      new ApiResponse(200,{},"Password Change Succesfully")
   )

 });

 const getCurrentUser  = asyncHandler( async (req,res) => {
      return res
      .status(200)
      .json(
         new ApiResponse(200,req.user,"User detail fetched successfully")
      )
 });

 const updateAccountDetails = asyncHandler( async (req,res) => {
      const { fullName, email} = req.body

      if(!fullName && !email) {
         throw new ApiError(401,"All Fields are required !")
      }

      //you have not use await below
      const user = await User.findByIdAndUpdate(req.user?._id,
         {
            $set: {
               fullName,
               email
            }

         },
         { new:true}
      ).select("-password")
      // console.log("user: ",user);
      return res
      .status(200)
      .json(
         new ApiResponse(200,user,"Account Details Updated Successfully")
      )
 })

 const updateUserAvatar = asyncHandler( async (req,res) => {
    const avatarLocalPath = req.file?.path
   //  console.log("avatarLocalPath: ",req.file)

    if(!avatarLocalPath) {
      throw new ApiError(400,"Avatar file is missing")
    }

   const avatar = await uploadOnCloudinary(avatarLocalPath)
   // console.log("avatar: ",avatar)

   if(!avatar.url) {
      throw new ApiError(400,"Error while uploading avatar !")
   }

   // console.log("avatar url: ",avatar.url);

  const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set:{
            avatar:avatar.url
         }

      },{new:true}
   ).select("-password")

   return res
   .status(200)
   .json(
      new ApiResponse(200,user,"avatar updated successfully")
   )

 })

 const updateUserCoverImage = asyncHandler( async (req,res) => {
      
      const coverImageLocalPath = req.file?.path
      console.log("request file: ",req.file)
      if(!coverImageLocalPath) {
         throw new ApiError(400,"Cover Image is missing")
      }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(coverImage.url) {
      throw new ApiError(400,"Error while uploding Cover Image !")
    }

   const user = await User.findByIdAndUpdate(
   req.user?._id,
   {
      $set: {
         coverImage:coverImage.url
      }
   },{ new:true}
   ).select("-password")

   return res
   .status(200)
   .json(
      new ApiResponse(200,user,"CoverImage updated successfully")
   )

 })

 //In below two functions we used aggregation pipelines
 const getUserChannelProfile = asyncHandler( async (req,res) => {

   const { username } = req.params

   if(!username?.trim()) {
      throw new ApiError(404,"username is missing");
   }

   const channel = await User.aggregate([
      {
         $match:{
            username:username?.toLowerCase()
            }
      },
      {
         $lookup: {
            from:"subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subscribers"
         }
      },
      {
         $lookup:{
            from: "subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscribedTo"
         }
      },
      {
         $addFields: {
            subscribersCount: {
               $size: "$subscribers"
            },
            subscribedToCount: {
               $size: "$subscribedTo"
            },
            isSubscribed: {
               $cond: {
                  if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                  then:true,
                  else:false
               }
            }
         }
      },
      {
         $project: {
            username:1,
            fullName:1,
            email:1,
            subscribersCount:1,
            subscribedToCount:1,
            isSubscribed:1,
            avatar:1,
            coverImage:1
         }
      }
   ])
   // console.log(channel) // check this out for better understanding
   //console.log(channel.length)
   
   if(!channel?.length) {
      throw new ApiError(404,"channel does not exists !")
   }

   return res
   .status(200)
   .json(
      new ApiResponse(200,channel,"User Channel fetched successfully")
   )
 })

 const getUserWatchHistory = asyncHandler( async (req,res) => {

      const user = await User.aggregate([
         {
         $match: {
            _id: new mongoose.Types.ObjectId(req.user._id)
         }
         },
         {
            $lookup: {
               from:"videos",
               localField: "watchHistory",
               foreignField: "_id",
               as: "watchHistory",
               pipeline: [
                  {
                     $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner",
                        pipeline:[
                           {
                           $project: {
                              fullName:1,
                              username:1,
                              avatar:1, 
                           }
                            //here you can  check for Projection ($project) of field which you have place in side the subpipeline.check for different stages where you can place it.
                        }
                     ]
                     }                   
                  },
                  //for better or ease  frontend handling of array, use add below field. we return first element of array.
                  {
                     $addFields: {
                        owner: {
                           $first: "$owner"
                        }
                     }
                  }
                 
               ]
            }
         }
   ])

   return res
   .status(200)
   .json(
      new ApiResponse(200,user[0].watchHistory,"Watch History fetched successfully")
   )
 })

export { registerUser,
         loginUser, 
         logoutUser,
         refreshAccessToken,
         changeCurrentPassword,
         getCurrentUser,
         updateAccountDetails,
         updateUserAvatar,
         updateUserCoverImage,
         getUserChannelProfile,
         getUserWatchHistory
};


//use thunder client // or postman login