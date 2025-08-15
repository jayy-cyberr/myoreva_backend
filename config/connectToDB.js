const mongoose = require("mongoose")
const dotEnv = require("dotenv")
dotEnv.config()

const mongoUri= process.env.mongo_uri

const connectToDB = async () => {
    try {
        console.log("connecting")
        
        const connected=await mongoose.connect(mongoUri)

        if(connected){
            console.log("connected to DB")
            
        }else{
            console.log("Not connected to DB")
            
        }
    } catch (error) {
        console.log(error)
    }
}

module.exports = connectToDB
