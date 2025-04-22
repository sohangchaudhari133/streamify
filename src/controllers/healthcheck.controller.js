import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {
    // Healthcheck endpoint
    // This endpoint is used to check if the server is running
        try {
            return res.status(200)
            .json(
                new ApiResponse(200,{status:"OK"}, "Service is running smoothly")
            );
        } catch (error) {
           throw new ApiError(500,"Healthcheck Failed",error.message);
        }
})

export {
    healthcheck
    };
    