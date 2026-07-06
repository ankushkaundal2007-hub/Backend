import mongoose from "mongoose";
import DB_NAME from "../constant.js"
const ConnectDb=async () => {
    console.log(process.env.MONGODB_URI);
    try {
        const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log("MONGODB CONNECTED SUCCESSFULLY:",connectionInstance.connection.host);
        
    } catch (error) {
        console.log("CONNECTION FAILED:",error);
        process.exit(1);
        
    }
    
}

export default ConnectDb;