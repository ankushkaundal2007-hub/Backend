import dotenv from "dotenv"
import express from "express";
import ConnectDb from "./db/index.js"
import  app  from "./App.js";
dotenv.config({
    path: '/env'
}, {
    debug: true
})
// const app = express()
const PORT=process.env.PORT || 8000;


ConnectDb()
.then(app.listen(PORT,()=>{
    console.log(`Server running at port ${PORT}`);
}))
.catch((err)=>{
    console.log(err);
}
)