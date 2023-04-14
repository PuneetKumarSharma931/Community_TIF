const mongoose = require('mongoose');

//Connecting MongoDB
const connectDB = async (MONGO_URI) => {

    try {
        
        const connectdb = await mongoose.connect(MONGO_URI);

        console.log(`MongoDB Successfully Connected, HOST:${connectdb.connection.host}`);

    } catch (error) {
        
        console.error(error);
        console.log("There was some error while connecting to the DB!!");
    }
}

module.exports = connectDB;