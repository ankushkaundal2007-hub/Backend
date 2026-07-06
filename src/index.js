import dotenv from "dotenv"
import express from "express";
import ConnectDb from "./db/index.js"
dotenv.config({
    path: '/env'
}, {
    debug: true
},
    { quiet: true })
const app = express()
ConnectDb();