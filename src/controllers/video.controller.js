import mongoose,{ isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { getVideoDuration } from "../utils/ffmpeg.js";

/**
 * Get all videos based on query, sorting, and pagination
 */
const getAllVideos = asyncHandler(async (req, res) => {
    // Extracting query parameters from the request
    const {
        page = 1, // Default page number is 1 if not provided
        limit = 10, // Default limit per page is 10
        query = "", // Default query is an empty string
        sortBy = "createdAt", // Default sorting field is "createdAt"
        sortType = "desc", // Default sorting order is descending
        userId, // User ID (optional, to filter videos by a specific user)
      } = req.query;

    // Checking if the user is logged in
    if(!req.user) {
        throw new ApiError(401,"User needs to be logged in");
    }

    // Constructing the match object to filter videos
    const match = {
        ...(query ? {title: { $regex: query, $options: "i"}} : {}), // If query exists, match titles that contain the search term (case-insensitive)
        ...(userId ? { owner: mongoose.Types.ObjectId(userId)} : {}), // If userId exists, filter videos by that owner
    };

   /* Why do we use $regex for query search?
     - $regex allows partial matching (e.g., searching "fun" will find "funny video").
     - $options: "i" makes it case-insensitive (e.g., "FUN" and "fun" are treated the same). */

    const videos = await Video.aggregate([
        {
            $match:match, // Filtering videos based on the match criteria
        },

        {
            $lookup: {
                from: "users",
                localField:"owner",
                foreignField: "_id",
                as: "VideosByOwner",
            },
        },

        {
            /*
        $project: Selecting only the necessary fields to return in the response

      */
            $project: {
                videoFile: 1, // Video file link
                thumbnail: 1, // Thumbnail image link
                title: 1, // Video title
                description: 1, // Video description
                duration: 1, // Video duration
                views: 1, // Number of views
                isPublished: 1, // Whether the video is published or not
                owner: {
                    $arrayElemAt: ["$videosByOwner", 0], // Extracts the first user object from the array
                },
            },
        },

        {
            /*
        $sort: Sorting videos based on the specified field
        - If sortType is "desc", sort in descending order (-1)
        - If sortType is "asc", sort in ascending order (1)
      */
            $sort: {
                [sortBy]: sortType === "desc" ? -1 : 1,
            },
        },

        {
            
             /*
                 $skip: Skipping records for pagination
                - Formula: (page number - 1) * limit
                - If page = 2 and limit = 10, skips (2-1) * 10 = 10 records
                */
            $skip: (page - 1) * parseInt(limit),
              
        },

        {
            /*
              $limit: Limits the number of results per page
              - Ensures that the number of results does not exceed the "limit" value
            */
            $limit: parseInt(limit),
          },
    ]);
    

    // If no videos are foundm throw an error
    if (!videos?.length) {
        throw new ApiError(404, "Videos are not found");
      }
    
    // Sending the response with a success message
    return res.status(200).json(new ApiResponse(200, videos, "Videos retrieved successfully"));
});

/**
 * Publish a new video
 */
const publishAVideo = asyncHandler(async (req, res) => {
    // Extracting required fields from request body and files
    const { title, description, owner } = req.body;
    

    if (!title || !description) {    
        throw new ApiError(400, "Title and description are required");
    }
    
    // Extract the video file path from the uploaded files
  const videoFileLocalPath = req.files?.videoFile[0]?.path;
  if (!videoFileLocalPath) {
    throw new ApiError(400, "Video file is required");
  }

  // Extract the thumbnail file path from the uploaded files
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is required");
  }
    try {
        // Get the duration of the video file before uploading
    const duration = await getVideoDuration(videoFileLocalPath);

    // Upload the video file to Cloudinary and get the URL
    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    if (!videoFile) {
      throw new ApiError(400, "Cloudinary Error: Video file is required");
    }

    // Upload the thumbnail image to Cloudinary and get the URL
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnail) {
      throw new ApiError(400, "Cloudinary Error: Thumbnail is required");
    }

    // Store video details in the database
    const videoDoc = await Video.create({
        videoFile: videoFile.url, // Cloudinary URL of the video file
        thumbnail: thumbnail.url, // Cloudinary URL of the thumbnail
        title,
        description,
        owner: req.user?._id, // ID of the user who uploaded the video
        duration, // Duration of the video (in seconds)
      });

      console.log(` Title: ${title}, Owner: ${owner}, duration: ${duration}`);

      // If video creation fails, throw an error
    if (!videoDoc) {
        throw new ApiError(500, "Something went wrong while publishing a video");
      }

      // Send a success response with the video details
    return res
      .status(201)
      .json(new ApiResponse(201, videoDoc, "Video published Successfully"));
    } catch (error) {
        // Handle errors and send a 500 response if something goes wrong
        throw new ApiError(500, error);
    }

});

/**
 * Get video by ID
 */
const getVideoById = asyncHandler(async (req, res) => {
    // Extract the videoId from request parameters
    const { videoId } = req.params;

    // Validate if the provided videoId is a valid MongoDB ObjectId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId).populate("owner","name","email");

    // If the video does not exist, return a 404 error.
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res.status(200).json(new ApiResponse(200, video, "Video retrieved successfully"));
});

/**
 * Update video details
 */
const updateVideo = asyncHandler(async (req, res) => {
    // Extract videoId from request parameters
    const { videoId } = req.params;

    // Extract title and description from request body
    const { title, description } = req.body;

    // Validate if the provided videoId is a valid MongoDB ObjectId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    if (!title && !description) {
        throw new ApiError(400, "Title or description is required");
    }

    // Create an object to hold updateData for updating title, description and thumbnail(thumbnail will be appended later)
    let updateData = { title, description };

    if (req.file) {
    const thumbnailLocalPath = req.file.path;

    if (!thumbnailLocalPath) {
      throw new ApiError(400, "Thumbnail file is missing");
    }

    // Upload the thumbnail to Cloudinary
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail.url) {
      throw new ApiError(400, "Error while uploading thumbnail");
    }

    // Add the new thumbnail URL to the updateData
    updateData.thumbnail = thumbnail.url;
  }

//   Update the video document in the database:
  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    { $set: updateData},
    { new:true, runValidators:true}
  );

  // If the video is not found, return error.
  if (!updatedVideo) {
    throw new ApiError(404, "Video not found");
  }

    return res.status(200).json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

/**
 * Delete video
 */
const deleteVideo = asyncHandler(async (req, res) => {

    // Extract the videoId from the request parameters
    const { videoId } = req.params;

    // Validate if the provided videoId is a valid MongoDB ObjectId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    /*
        Delete the video from the database.
    - `findByIdAndDelete(videoId)`: Finds a video by its ID and removes it.
    - If the video does not exist, `deletedVideo` will be null.
  */
    const deletedVideo = await Video.findByIdAndDelete(videoId);
    if (!deletedVideo) {
        throw new ApiError(404, "Video not found");
    }

    return res.status(200).json(new ApiResponse(200, deletedVideo, "Video deleted successfully"));
});

/**
 * Toggle video publish status
 */
const togglePublishStatus = asyncHandler(async (req, res) => {
    // Extract the videoId from the request parameters.
    const { videoId } = req.params;

    // Validate if the provided videoId is a valid MongoDB ObjectId.
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    /*
    Toggle the `isPublished` status of the video.
    - If it's `true`, set it to `false`.
    - If it's `false`, set it to `true`.
  */
    video.isPublished = !video.isPublished;
    // Save the updated video status in the database.
     await video.save();

    return res.status(200).json(new ApiResponse(200, video, "Video publish status updated successfully"));
});

export { getAllVideos, publishAVideo, getVideoById, updateVideo, deleteVideo, togglePublishStatus };
