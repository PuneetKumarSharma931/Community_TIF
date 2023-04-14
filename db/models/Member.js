const mongoose = require('mongoose');
const { Snowflake } = require('@theinternetfolks/snowflake');

const MemberSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        default: Snowflake.generate
    },
    community: {
        type: String,
        ref: 'Community'
    },
    user: {
        type: String,
        ref: 'User'
    },
    role: {
        type: String,
        ref: 'Role'
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

const Member = new mongoose.model('Member', MemberSchema);

module.exports = Member;