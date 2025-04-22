import { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
    // Function to get comments for a specific video
    
    // Step 1: Extract videoId from request parameters

    const { videoId } = req.params;

    /* Step 2: Extract pagination details from query parameters
     - page = 2 (fetch second page of comments)
       - limit = 5 (fetch 5 comments per page)
     - If no values are provided, default to page 1 and limit 10 */

    const { page = 1, limit = 10 } = req.query;

    /* Step 3: Validate videoId
    / - MongoDB uses ObjectId format, so we need to check if videoId is a valid ObjectId.*/

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // console.log("Video ID:", videoId, "Type:", typeof videoId); // Debugging log

    /*
    Step 4: Convert videoId to ObjectId
    - MongoDB stores IDs as ObjectId, so we need to convert videoId (string) to ObjectId format.
    - This ensures correct matching in the database.
  */
    const videoObjectId = new mongoose.Types.ObjectId(videoId);

    // Step 5: Fetch comments using aggregation
    const comments = await Comment.aggregate([
        {
            $match: {
                videoId:videoObjectId, // Match comments for the specific videoId
            },
        },
        {
            // Lookup video details
            $lookup: {
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"CommentOnWhichVideo",
            },
        },
        {
            // Lookup user details (comment owner)
            $lookup: {
                from:"users",
                localField: "owner",
                foreignField:"_id",
                as:"OwnerOfComment",
            },
        },

        {
            $project: {
                content:1,
                owner: {
                    $arrayElemAt:["$OwnerOfComment",0], // Get the first element from owner array (user details)
                },
                video: {
                    $arrayElemAt:["$CommentOnWhichVideo",0], // Get the first element from video array (video details)
                },
                createdAt:1, // Comment creation date
            },
        },

        {
        // step 6: Apply pagination
            $skip: (page - 1) *parseInt(limit), // Skip comments for pagination
        },
        {
            $limit: parseInt(limit), // Limit the number of comments returned

        },
    ]);
    console.log(comments) // Debugging log

    // Step 7: Check if any comments exist
    if(!comments?.length) {
        throw new ApiError(404,"No comments found for this video");
    }

    // Step 8: Send response with comments data
    return res.status(200).json(new ApiResponse(200, comments, "Comments retrieved successfully"));
});

const addComment = asyncHandler(async (req, res) => {
    // Function to add a comment to a video
    
    //  Check if user is authenticated
    if (!req.user || !req.user._id) {
        throw new ApiError(401, "User authentication required");
    }

    // Extracting video Id from request parameters
    const { videoId } = req.params;

    // Extracting content from request body
    const { comment } = req.body;

    // Checking if the provided videoId is a valid MongoDB ObjectId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id");
    }

    // Checking if the content is empty
    if (!comment) {
        throw new ApiError(400, "Comment is required");
    }

    // Creating the new comment in the database
    const newComment = await Comment.create({
        video: videoId,
        comment,
        owner: req.user._id, //  Linking comment to the logged-in user
    });

    // Checking if the comment was successfully created
    if(!newComment) {
        throw new ApiError(500, "Failed to add comment");
    }

    // Sending a success response with the created comment
    return res.status(200).json(new ApiResponse(200, newComment, videoId, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
    
    // Ensuring user is authenticated to update the comment
    if (!req.user || !req.user._id) {
        throw new ApiError(401, "User authentication required");
    }

    // Extracting commentId from request parameters
    const { commentId } = req.params;

    // Extracting updated comment content from request body
    const { comment } = req.body;


    // Checking if the provided commentId is a valid MongoDB ObjectId

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment Id");
    }

    // Checking if the updated content is empty
    if (!comment) {
        throw new ApiError(400, "Comment is required");
    }

    // Finding and updating the comment in the database

    const updatedComment = await Comment.findOneAndUpdate({
        _id: commentId,
        owner: req.user._id, // Ensuring only the comment owner can update it
    },
    {
        $set: {
            comment,
        },
    },
    { new: true }) // Return the updated comment

    if (!updatedComment) {
        throw new ApiError(404, "Something went wrong, while updating the comment");
    }

   
    // Sending a success response
    return res.status(200).json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
    // Function to delete a comment

    // Ensuring user is authenticated to delete the comment
    if (!req.user || !req.user._id) {
        throw new ApiError(401, "User authentication required");
    }

    // Extracting commentId from request parameters
    const { commentId } = req.params;

    // Checking if the provided commentId is a valid MongoDb ObjectId

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment Id");
    }

    //Find the comment and delete it from the database
    const deletedComment = await Comment.findOneAndDelete({
        _id: commentId,
        owner: req.user._id, // Ensuring only the comment owner can delete it
    });

    //Checking if the comment was successfully deleted
    if(!deletedComment) {
        throw new ApiError(404,"Something went wrong, while deleting the comment");
    }

    // Sending a success response with deleted commnent details
    return res.status(200).json(new ApiResponse(200, deletedComment, "Comment deleted successfully"));
});

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
};
