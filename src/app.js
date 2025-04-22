import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";


const app = express();

app.use(cors(
    {
        origin: process.env.CORS_ORIGIN,
        credentials: true
    }
))

//json data
app.use(express.json({limit: "16kb"}));

//url data
app.use(express.urlencoded({limit:"16kb"}));

//public folder (images)
app.use(express.static("public"));

//cookie-parser
app.use(cookieParser());


//Routes import here !
import userRouter from "./routes/user.routes.js";
import commentRouter from "./routes/comment.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import healthRouter from "./routes/healthcheck.routes.js";
import likeRouter from "./routes/like.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import videoRouter from "./routes/video.routes.js";

//routes declaration Here 
app.use("/api/v1/users",userRouter)
app.use("/api/v1/health",healthRouter)
app.use("/api/v1/comments",commentRouter)
app.use("/api/v1/dashboard",dashboardRouter)
app.use("/api/v1/likes",likeRouter)
app.use("/api/v1/playlists",playlistRouter)
app.use("/api/v1/subscription",subscriptionRouter)
app.use("/api/v1/tweets",tweetRouter)
app.use("/api/v1/videos",videoRouter)
//so here we have to declare it one time for each route path with routerName.And in route we can declare many path after this.

export { app }