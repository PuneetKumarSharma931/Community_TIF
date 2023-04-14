const express = require('express');
const User = require('../db/models/User');
const Community = require('../db/models/Community');
const Role = require('../db/models/Role');
const Member = require('../db/models/Member');
const { ensureAuth } = require('../middlewares/ensureAuth');

const router = express.Router();

//@Route /v1/community
//auth header required
//@desc Create a new community from given data

router.post('/', ensureAuth, async (req, res) => {

    try {
        
        if(req._id === undefined) {

            return;
        }

        const user = await User.findOne({ _id: req._id }).lean();

        if(!user) {

            res.status(401).json({
                status: false,
                errors: [{
                    message: "You need to sign in to proceed.",
                    code: "NOT_SIGNEDIN"
                }]
            });

            return;
        }

        req.body.name = req.body.name === undefined ? undefined : req.body.name.trim();

        if(!req.body.name || req.body.name.length < 2) {

            res.status(400).json({
                status: false,
                errors: [{
                    param: "name",
                    message: "Name should be at least 2 characters.",
                    code: "INVALID_INPUT"
                }]
            });

            return;
        }

        //Generating Unique Slug for the community name

        let slug = req.body.name.toLowerCase().split(" ").join("-");

        const communities = await Community.find({ name: req.body.name }).lean();

        const count = communities === undefined ? 0 : communities.length;

        if(count !== 0) {

            slug = slug + count.toString();
        } 

        const newCommunity = new Community({
            name: req.body.name,
            slug,
            owner: user._id
        });

        let createdCommunity = await newCommunity.save();

        const communityAdmin = await Role.findOne({ name: "Community Admin"}).lean();

        const newMember = new Member({
            community: createdCommunity._id,
            user: user._id,
            role: communityAdmin._id
        });

        const createdMember = await newMember.save();

        createdCommunity = createdCommunity.toObject();

        delete createdCommunity.__v;

        res.status(200).json({
            status: true,
            content: {
                data: createdCommunity
            }
        });

    } catch (error) {
        
        console.error(error);

        res.status(500).json({
            status: false,
            errors: [{
                message: "Some internal server error occured."
            }]
        });
    }
});

//@Route GET /v1/community
//@desc List all the communities

router.get('/', async (req, res) => {

    try {
        
        //Pagination

        const queryParams = req.query;

        let page = Number(queryParams.page) || 1;
        let pageSize = Number(queryParams.pageSize) || 10;

        if(page < 0)
            page = 1;

        if(pageSize < 1)
            pageSize = 1;

        let communities = await Community.find().lean();

        const total = communities.length;
        const pages = Math.ceil(total/pageSize);

        const skip = (page - 1)*pageSize;

        communities = await Community.find({}, {__v: 0}).skip(skip).limit(pageSize).populate({ path: 'owner', select: '_id name'}).lean();

        res.status(200).json({
            status: true,
            content: {
                meta: {
                    total,
                    pages,
                    page
                },
                data: communities
            }
        });

    } catch (error) {
        
        console.error(error);

        res.status(500).json({
            status: false,
            errors: [{
                message: "Some internal server error occured."
            }]
        });
    }
});

//@Route GET /v1/community/:id/members
//@desc List all the members of a community

router.get('/:id/members', async (req, res) => {

    try {
        
        const slug = req.params.id;

        const community = await Community.findOne({ slug }).lean();

        if(!community) {

            res.status(400).json({
                status: false,
                errors: [{
                    param: "id",
                    message: "Community does not exist.",
                    code: "INVALID_INPUT"
                }]
            });

            return;
        }

        //Pagination

        let members = await Member.find({ community: community._id }, { __v: 0 }).lean();

        const queryParams = req.query;

        let page = Number(queryParams.page) || 1;
        let pageSize = Number(queryParams.pageSize) || 10;

        if(page < 0)
            page = 1;

        if(pageSize < 1)
            pageSize = 1;

        const total = members.length;
        const pages = Math.ceil(total/pageSize);

        const skip = (page - 1)*pageSize;

        members = await Member.find({ community: community._id }, {__v: 0}).skip(skip).limit(pageSize).populate({ path: 'user', select: '_id name'}).populate({ path: 'role', select: '_id name'}).lean();

        res.status(200).json({
            status: true,
            content: {
                meta: {
                    total,
                    pages,
                    page
                },
                data: members
            }
        });

    } catch (error) {
        
        console.error(error);

        res.status(500).json({
            status: false,
            errors: [{
                message: "Some internal server error occured."
            }]
        });
    }
});

//@Route GET /v1/community/me/owner
//auth header required
//@desc Get all the owned communities of signed in user

router.get('/me/owner', ensureAuth, async (req, res) => {

    try {
        
        if(req._id === undefined) {

            return;
        }

        const user = await User.findOne({ _id: req._id });

        if(!user) {

            res.status(401).json({
                status: false,
                errors: [{
                    message: "You need to sign in to proceed.",
                    code: "NOT_SIGNEDIN"
                }]
            });

            return;
        }

        //Pagination

        let communities = await Community.find({ owner: user._id }).lean();

        const queryParams = req.query;

        let page = Number(queryParams.page) || 1;
        let pageSize = Number(queryParams.pageSize) || 10;

        if(page < 0)
            page = 1;

        if(pageSize < 1)
            pageSize = 1;

        const total = communities.length;
        const pages = Math.ceil(total/pageSize);
    
        const skip = (page - 1)*pageSize;

        communities = await Community.find({ owner: user._id }, { __v: 0}).skip(skip).limit(pageSize).lean();

        res.status(200).json({
            status: true,
            content: {
                meta: {
                    total,
                    pages,
                    page
                },
                data: communities
            }
        });

    } catch (error) {
        
        console.error(error);

        res.status(500).json({
            status: false,
            errors: [{
                message: "Some internal server error occured."
            }]
        });
    }
});

//@Route GET /v1/community/me/member
//auth header required
//@desc Get all the joined communities of the signed in user

router.get('/me/member', ensureAuth, async (req, res) => {

    try {
        
        if(req._id === undefined) {

            return;
        }

        const user = await User.findOne({ _id: req._id });

        if(!user) {

            res.status(401).json({
                status: false,
                errors: [{
                    message: "You need to sign in to proceed.",
                    code: "NOT_SIGNEDIN"
                }]
            });

            return;
        }

        //Pagination

        let members = await Member.find({ user: user._id }, { community: 1, _id: 0}).populate({ path: 'community', select: '_id'}).lean();

        const queryParams = req.query;

        let page = Number(queryParams.page) || 1;
        let pageSize = Number(queryParams.pageSize) || 10;

        if(page < 0)
            page = 1;

        if(pageSize < 1)
            pageSize = 1;

        const total = members.length;
        const pages = Math.ceil(total/pageSize);
    
        const skip = (page - 1)*pageSize;
        let communityIds = [];

        members.forEach((member) => {

            communityIds.push(member.community);

        });
        
        const requiredCommunities = await Community.find({ $or: communityIds }, { __v: 0 }).populate({ path: 'owner', select: '_id name' }).skip(skip).limit(pageSize).lean();

        res.status(200).json({
            status: true,
            content: {
                meta: {
                    total,
                    pages,
                    page
                },
                data: requiredCommunities
            }
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            status: false,
            errors: [{
                message: "Some internal server error occured."
            }]
        });
    }
});

module.exports = router;