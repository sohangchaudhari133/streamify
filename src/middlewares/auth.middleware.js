import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

// Middleware to verify the JWT token
// If token is valid, it will add the user object to the request object
export const verifyJWT = asyncHandler( async(req,res,next) => {

 try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
   
    if(!token) {
       throw new ApiError(401,"Unauthorized request ! (Token not found)")
    }
   
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
   
    const user = await User.findById(decodedToken._id).select("-password -refreshToken")
   
    if(!user){
       throw new ApiError(401,"Invalid Access Token")
    }
   
    req.user = user;
    next()
 } catch (error) {
    throw new ApiError(401,error?.message || "Invalid access token")
 }

});