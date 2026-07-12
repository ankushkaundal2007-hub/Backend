import mongoose from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
const UserSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true,
        lowercase:true,
        trim:true,
        index:true
    },
    watchHistory:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    email:{
        type:String,
        lowercase:true,
        required:true,
        trim:true
    },
    FullName:{
        type:String,
        required:true
    },
    avatar:{
        type:String,
        required:true
    },
    coverImage:{
        type:String,
    },
    password:{
        type:String,
        required:true
    },
    RefreshToken:{
        type:String
    }
},{timestamps:true});

//A MIDDLEWARE HOOK TO HASH THE PASSWORD BEFORE STORING
UserSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }                                 

    next;
});

UserSchema.methods.isPasswordCorrect=async function (password) {
  return await bcrypt.compare(password,this.password)
    
}

UserSchema.methods.generateAccessToken=function () {
    return jwt.sign(
        {
            _id:this._id,
            username:this.username,
            email:this.email,
            FullName:this.FullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
    
}
UserSchema.methods.generateRefreshToken=function () {
    return jwt.sign(
        {
            _id:this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
    
}


const User=mongoose.model("User",UserSchema);
export default User;