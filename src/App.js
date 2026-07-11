import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
const app=express()
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser({limit:"16kb"}))
app.use(express.static("Public"));

//import router

import  userRouter from "./routes/user.route.js"
app.use("/api/users",userRouter)
//http://localhost:3000/api/users
export default app;
