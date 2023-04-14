const express = require('express');

const connectDB = require('./db/connection');

const dotenv = require('dotenv');

//Environment variables
dotenv.config({ path: './config/config.env' });

//Connecting MongoDB
connectDB(process.env.MONGO_URI);

const port = process.env.PORT || 5000;

const app = express();

//Using middleware of express to recognize json
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Setting Routes
app.use('/v1/role', require('./routes/role'));
app.use('/v1/auth', require('./routes/user'));
app.use('/v1/community', require('./routes/community'));
app.use('/v1/member', require('./routes/member'));

//Setting express server to listen on given port
app.listen(port, ()=> {

    console.log(`The Server is running on port:${port}`);

});
