import { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
    // Extract the tweet content from the request body
    const { content } = req.body;
    
    // If no content is provided, throw an error.
    if (!content) {
        throw new ApiError(400, "Content is required");
    }

   // Get the logged-in user's ID
   const ownerId = req.user._id;
    if (!ownerId) {
        throw new ApiError(404, "User not found");
    }
    
    // Create a new tweet
    const newTweet = await Tweet.create({
        content,
        owner: ownerId,
    });

    // Error Handling: If something goes wrong with saving to the database
  if (!newTweet) {
    throw new ApiError(500, "Something went wrong while creating a tweet");
  }

  //Success Response  
    return res.status(201).json(new ApiResponse(201, newTweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
    // Extract userId from params
    const { userId } = req.params;
    
    // We need to ensure the provided user ID is a valid MongoDB ObjectId
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId");
    }
    
    // Fetch tweets from the database
     // We query the Tweet collection for tweets where the 'owner' field matches the userId
    const tweets = await Tweet.find({ owner: userId }).sort({ createdAt: -1 });

    //  Handle case where no tweets are found
  if (!tweets || tweets.length === 0) {
    throw new ApiError(404, "Tweets are not found");
  }

  // Return the response with tweets
    return res.status(200).json(new ApiResponse(200, tweets, "Tweets retrieved successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
    // Extract tweetId from params and content from body
    const { tweetId } = req.params;
    const { content } = req.body;

    // Get the ID of the currently authenticated user
  const userId = req.user._id;

  /*
    Tweet Updating Logic:
    - `tweetId`: The ID of the tweet the user wants to update.
    - `content`: The new content that will replace the existing tweet.
    - `userId`: The ID of the user attempting to update the tweet.
  */
    if (!content) {
        throw new ApiError(400, "Content is required");
    }

    // Validate if tweetId is a proper MongoDB ObjectId
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweetId");
    }

    // Fetch the existing tweet from the database:
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    // Ensure the user updating the tweet is the owner
    if (tweet.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You can only update your own tweets");
    }

    // Update tweet content
    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
        $set: {
            content,
        },
          },
          {
            new: true,
          }
);

    if (!updatedTweet) {
         throw new ApiError(500, "Something went wrong while updating the tweet");
    }
    return res.status(200).json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
   // Extract the tweetId from request parameters (The ID of the tweet the user wants to delete.)
    const { tweetId } = req.params;

    // Get the currently logged-in user's ID
  const userId = req.user._id;

  // Validate if tweetId is a proper MongoDB ObjectId
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    // Find the tweet in the database.
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    // Ensure the user deleting the tweet is the owner
    if (tweet.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You can only delete your own tweets");
    }

    /*
    Delete the tweet from the database.
    - `findByIdAndDelete(tweetId)`: Finds the tweet by its ID and deletes it.
  */
    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

    if (!deletedTweet) {
        throw new ApiError(500, "Something went wrong while deleting a tweet");
      }
    
    // 
    return res.status(200).json(new ApiResponse(200, null, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
