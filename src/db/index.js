import mongoose from "mongoose";
import {DATABASE_NAME} from "../constants.js";


const connectDB = async () => {

    try {

      const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DATABASE_NAME}`)
      
      //check this connectionInstance in console log for more knowledge !
      console.log(`MongoDB Connnected !! DB Host: ${connectionInstance.connection.host}`);
      // this will give the host to which it is connected, like for different purposes(development,production etc).
    
    } catch (error) {
        console.error("CONNECTION FAILED(MDB)",error);
        process.exit(1)
    }
}
export default connectDB;