const mongoose = require('mongoose');
const { Snowflake } = require('@theinternetfolks/snowflake');

const RoleSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        default: Snowflake.generate
    },
    name: {
        type: String,
        unique: true
    },
    scopes: [{type: String}],
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

const Role = new mongoose.model('Role', RoleSchema);

module.exports = Role;