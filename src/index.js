import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config();
//use dotenv as above otherwise you will get many error !


connectDB()
.then( () => {

    //this is for me ! you can delete this if you want.
    app.on("Eror",(error) => {
        console.log("Express Error Occurs",error);
    });

    app.listen ( process.env.PORT || 4000, () => {
        console.log(`Server listening on port ${process.env.PORT || 4000}`);   
    })
})
.catch((Error) => {
    console.log("MongoDB Connection Failed !!!",Error);
});







/* first approach
import express from "express";
const app = express();
//mongodb connection through mongoose | IIFE
( async () => {
   try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    app.on("errror",(error) => {
        console.log("CONNECTION FAILED(EXPRESS-SIDE)",error);
       
    })

    app.listen(process.env.PORT,() => {
        console.log(`App is listening on port ${process.env.PORT}`);
    })
   } catch (error) {
    console.error("CONNECTION FAILED(MDB): ",error);
   }
})()
*/