import { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {

    // Extract videoId from request parameters (The ID of the video that the user wants to like/unlike)
    const { videoId } = req.params;

    // Get the userId of the currently authenticated user
    const userId = req.user?._id; 


    // Validate if videoId is a proper MongoDB ObjectId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }


    const existingLike = await Like.findOne({ video: videoId, likeBy: userId });

    /*
     Toggle Like Logic:
    - If the user already liked the video, remove the like (Unlike it).
    - If the user hasn't liked it yet, create a new like (Like it).
  */
    if (existingLike) {
        await Like.findByIdAndDelete({ _id: existingLike._id }); // Corrected removal method
        return res.status(200).json(new ApiResponse(200, existingLike, "Video Like removed"));
    } 
    //If no like exists, create a new like
    const likedVideo = await Like.create({ video: videoId, likeBy: userId });

    return res.status(201).json(new ApiResponse(201, likedVideo, "Video Like added"));
   
});

const toggleCommentLike = asyncHandler(async (req, res) => {

    // Extract commentId from request parameters
    const { commentId } = req.params;
    
    // Get the userId from the authenticated user
    const userId = req.user?._id;

    // Validate if commentId is a proper MongoDB ObjectId
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment Id");
    }

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const commentLike = await Like.findOne({ comment: commentId, likeBy: userId }); // Fixed query

    if (commentLike) {
        await Like.findByIdAndDelete(commentLike._id );

        return res.status(200).json(new ApiResponse(200, commentLike, "Comment Like removed"));
    } 
    // If no like exists, create a new like
    const likeComment =  await Like.create({ comment: commentId, likeBy: userId });

        return res.status(201).json(new ApiResponse(201, likeComment, " Comment Like added"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    // This controller has same logic explanation as above
    const { tweetId } = req.params;

    const userId = req.user?._id;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const tweetLike = await Like.findOne({ tweet: tweetId, likeBy: userId });

    if (tweetLike) {
        await Like.findByIdAndDelete(tweetLike._id);

        return res.status(200).json(new ApiResponse(200, tweetLike, "Like removed"));
    } 
    const likeTweet = await Like.create({ tweet: tweetId, likeBy: userId });
    return res.status(201).json(new ApiResponse(201, likeTweet, "Like added"));
    
});

const getLikedVideos = asyncHandler(async (req, res) => {
    // Extract userId from the authenticated user
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    
    const likedVideos = await Like.find({
         likeBy: userId,
        /*
      What does `$exists: true` do?
      - This ensures that the `video` field is present in the document.
      - Why? Because the `Like` collection stores likes for multiple entities (e.g., tweets or comments).
      - Without this check, we might accidentally return likes for comments and tweets instead of videos.
    */
        
     video: { $exists: true },
     }).populate("video","_id title url"); //Populate the video details

    if (!likedVideos.length) {
        return res.status(200).json(new ApiResponse(200, [], "No videos found"));
    }

    return res.status(200).json(new ApiResponse(200, likedVideos, "Liked Videos fetched successfully"));
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
};
