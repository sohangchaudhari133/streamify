import mongoose, {Mongoose, isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
    // EXtracting useId from req.user
    const owner = req.user?._id;

    // Extract playlist details from request body
    const { name, description } = req.body;
    

    if (!name || !description) {
        throw new ApiError(400, "Playlist name and description are required");
    }

    const playlist = await Playlist.create({ name, description, owner });

    if (!playlist) {
        throw new ApiError(500, "Something went wrong while creating the playlist");
      }
    return res.status(201).json(new ApiResponse(201, playlist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    // Extract userId from the request parameters
    const userId = req.params; 

    // Validate if the provided userId is a valid MongoDB ObjectId
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const playlists = await Playlist.find({ owner: userId }).sort({createdAt: -1});

    // If no playlists exist for the user, return a 404 error.
  if (!playlists || playlists.length === 0) {
    throw new ApiError(404, "Playlist not found");
  }

    return res.status(200).json(new ApiResponse(200, playlists, "User playlists retrieved successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
    // Extract playlistId from request parameters

    const { playlistId } = req.params;


    // Validate if playlistId is a valid MongoDB ObjectId
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const playlist = await Playlist.findById(playlistId).populate("videos");
    // If the playlist is not found, return a 404 error.
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    return res.status(200).json(new ApiResponse(200, playlist, "Playlist retrieved successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {

    // Extract playlistId and videoId from request parameters.
    const { playlistId, videoId } = req.params;

    // Validate if playlistId and videoId are valid MongoDB ObjectIds.
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID");
    }

    const updatedPlaylist = await Playlist.aggregate([
    {
        $match: {
            _id: new mongoose.Types.ObjectId(playlistId), // Find the playlist by ID
        },
    },
    {
        $addFileds: {
            videos: {
                $setUnion: ["$videos",[new mongoose.Types.ObjectId(videoId)]] // Add the video ID to the videos array, ensuring no duplicates
                },
            },
    },
    {
        $merge: {
            into:"playlists", // update the existing playlist collection
        },
    },
]);

    // If no update was made, return an error.
  if (!updatedPlaylist) {
    throw new ApiError(404, "Playlist not found or video already added");
  }

    return res.status(200).json(new ApiResponse(200, updatedPlaylist, "Video added to playlist successfully"));
}
);

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    // Extract playlistId and videoId from request parameters
    const { playlistId, videoId } = req.params;

    // Validate both IDs to make sure they're legit MongoDB ObjectIds
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video id");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId,
        {
            $pull: { videos: new mongoose.Types.ObjectId(videoId) 
            },
        },
        {
            new: true, // Return the updated playlist
        },
    );

    // If no playlist is found, return a 404 error.
if (!updatedPlaylist) {
    throw new ApiError(404, "Playlist not found");
  }

    return res.status(200).json(new ApiResponse(200, updatedPlaylist, "Video removed from playlist successfully"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
    //  Extract playlistId from request parameters
    const { playlistId } = req.params;

    // Validate if playlistId is a valid MongoDB ObjectId
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    // Delete the playlist from the database using findByIdAndDelete.
    const playlist = await Playlist.findByIdAndDelete(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    
    return res.status(200).json(new ApiResponse(200, playlist, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {

    // Extracting playlistId and new playlist details from the request.
    const { playlistId } = req.params;
    const { name, description } = req.body;

    // Validate the playlist ID
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id");
    }

    // Ensure name and description are provided
    if (!name && !description) {
        throw new ApiError(400, "Name or description cannot be empty");
    }

    // Find and update the playlist in the database
    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
    {
        $set: {
        name,
        description,
        },
    },{
        new: true,
    });

    //  If the playlist is not found, return a 404 error.
    if(!playlist) {
        throw new ApiError(404,"Playlist not found");
    }

    return res.status(200).json(new ApiResponse(200, playlist, "Playlist updated successfully"));
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
};
