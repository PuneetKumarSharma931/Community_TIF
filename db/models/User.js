const mongoose = require('mongoose');
const { Snowflake } = require('@theinternetfolks/snowflake');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        default: Snowflake.generate
    },
    name: {
        type: String,
        required: true,
        trim: true,
        default: ""
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

//Hashing Password before saving it in DB
UserSchema.pre("save", async function(next) {

    try {
        
        this.password = await bcrypt.hash(this.password, 10);

        next();

    } catch (error) {
        
        throw new Error(error);
    }
});

const User = new mongoose.model('User', UserSchema);

module.exports = User;