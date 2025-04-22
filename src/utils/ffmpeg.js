import ffmpeg from 'fluent-ffmpeg';

// Function to get the duration of a video file
// This function takes the path of a video file as input and returns a Promise
// The Promise resolves with the duration of the video (in seconds) or rejects if there's an error
export const getVideoDuration = (videoPath) => {
    
    return new Promise((resolve,reject) => {
        // ffprobe is a method provided by fluent-ffmpeg to analyze video metadata
        ffmpeg.ffprobe(videoPath,(err,metadata) => {
            if(err){
                // If an error occurs, reject the Promise with an error message
                reject(`Error getting video duration: ${err.message}`);
            } else {
              // If successful, resolve the Promise with the duration of the video
                resolve(metadata.format.duration)
            }
        })
    })
}