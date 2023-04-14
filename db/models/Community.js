const mongoose = require('mongoose');
const { Snowflake } = require('@theinternetfolks/snowflake');

const CommunitySchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        default: Snowflake.generate
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
    },
    owner: {
        type: String,
        ref: 'User'
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

const Community = new mongoose.model('Community', CommunitySchema);

module.exports = Community;