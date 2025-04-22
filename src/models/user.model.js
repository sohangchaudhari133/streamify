import {mongoose,Schema} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            lowercase: true,
            unique:true,
            trim:true,
            index:true   //for better searching we use index.
        },
        email: {
            type: String,
            required: true,
            lowercase:true,
            unique:true,
            trim:true,
        },
        fullName: {
            type: String,
            required: true,
            trim:true,
            index:true
        },
        avatar: {
            type: String, //url String
            required: true,
        },
        coverImage: {
            type: String, // url link String   
        },
        password:{
            type: String,
            required:[ true,"Password is Required !"]
        },
        refreshToken: {
            type: String, // long String values
        },
        watchHistory: [
            {
                type:Schema.Types.ObjectId,
                ref:"Video"
            }
        ]
    }
,{timestamps:true});


// function which encrypt the password
userSchema.pre("save", async function (next) {
   if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password,10)
   next()
});

//custom function to check for the password encryption !
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(String(password),this.password)
}

//read document for env file variables use below !

userSchema.methods.generateAccessToken = function () {
    // it return the token so handle in variable or direct return the token
   return jwt.sign(
        {
            _id: this._id,
            email:this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }  
    );
}


userSchema.methods.generateRefreshToken = function () {
    if (!this._id) {
        throw new Error('User ID is missing');
    }
    
    try {
        return jwt.sign(
            {
                _id: this._id,
            },
            process.env.REFRESH_TOKEN_SECRET,
            {
                expiresIn: process.env.REFRESH_TOKEN_EXPIRY
            }
        );
    } catch (error) {
        console.error('Error generating refresh token:', error);
        throw new Error('Failed to generate refresh token');
    }
}


export const User = mongoose.model("User",userSchema);
  