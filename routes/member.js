const express = require('express');
const User = require('../db/models/User');
const Community = require('../db/models/Community');
const Role = require('../db/models/Role');
const Member = require('../db/models/Member');
const { ensureAuth } = require('../middlewares/ensureAuth');
const router = express.Router();

//@Route POST /v1/member
//auth header required
//@desc Adding a member to the community

router.post('/', ensureAuth, async (req, res) => {

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

        const community = await Community.findOne({ _id: req.body.community}).lean();

        if(!community) {

            res.status(400).json({
                status: false,
                errors: [{
                    param: "community",
                    message: "Community not found.",
                    code: "RESOURCE_NOT_FOUND"
                }]
            });

            return;
        }

        //Checking Whether The signed in user is the Admin of the community in which they are trying to add a user

        const communityMembers = await Member.find({ community: community._id }).populate('role').lean();

        let canAddMembers = false;

        communityMembers.forEach((communityMember) => {

            if(communityMember.user === user._id) {

                if(communityMember.role.name === "Community Admin") {

                    canAddMembers = true;
                }
            }
        });

        if(!canAddMembers) {

            res.status(400).json({
                status: false,
                errors: [{
                    message: "You are not authorized to perform this action.",
                    code: "NOT_ALLOWED_ACCESS"
                }]
            });

            return;
        }

        //Checking whether the user who is being added is present or not

        const userToAdd = await User.findOne({ _id: req.body.user }).lean();

        if(!userToAdd) {

            res.status(400).json({
                status: false,
                errors: [{
                    param: "user",
                    message: "User not found.",
                    code: "RESOURCE_NOT_FOUND"
                }]
            });

            return;
        }

        //Checking whether the role is present or not

        const role = await Role.findOne({ _id: req.body.role }).lean();

        if(!role) {

            res.status(400).json({
                status: false,
                errors: [{
                    param: "role",
                    message: "Role not found.",
                    code: "RESOURCE_NOT_FOUND"
                }]
            });

            return;
        }

        //Checking whether the user is already added to the community

        const memberships = await Member.find({ user: req.body.user }, { community: 1, _id: 0 }).lean();

        let isAlreadyAdded = false;
        
        memberships.forEach((member) => {

            if(member.community === req.body.community) {

                isAlreadyAdded = true;
            }
        });

        if(isAlreadyAdded) {

            res.status(400).json({
                status: false,
                errors: [{
                    message: "User is already added in the community.",
                    code: "RESOURCE_EXISTS"
                }]
            });

            return;
        }

        //Adding user to the community

        const newMember = new Member(req.body);

        let createdMember = await newMember.save();

        createdMember = createdMember.toObject();

        delete createdMember.__v;

        res.status(200).json({
            status: true,
            content: {
                data: createdMember
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

//@Route DELETE /v1/member/:id
//auth header is required
//@desc Removing a user from the communities

router.delete('/:id', ensureAuth, async (req, res) => {

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

        //Finding the community Ids of all the communities in which the user can be removed

        const memberships = await Member.find({ user: user._id }).populate('role').lean();

        let membershipsAdmin = [];

        memberships.forEach((membership) => {

            if((membership.role.name === "Community Admin") || (membership.role.name === "Community Moderator")) {

                membershipsAdmin.push(membership);
            }
        });

        const removeMemberShips = await Member.find({ user: req.params.id }).populate('role').lean();

        let membersShipsToRemove = [];

        removeMemberShips.forEach((membership) => {

            if((membership.role.name !== "Community Admin") && (membership.role.name !== "Community Moderator")) {

                membersShipsToRemove.push(membership);
            }
        });

        let st = new Set();

        membershipsAdmin.forEach((membership) => {

            st.add(membership.community);
        });

        let finalMembershipsDelete = [];

        membersShipsToRemove.forEach((membership) => {

            if(st.has(membership.community)) {

                finalMembershipsDelete.push({user: req.params.id, community: membership.community});
            }
        });

        if(finalMembershipsDelete.length === 0) {

            res.status(400).json({
                status: false,
                errors: [{
                    message: "Member not found.",
                    code: "RESOURCE_NOT_FOUND"
                }]
            });

            return;
        }

        await Member.deleteMany({$or: finalMembershipsDelete});

        res.status(200).json({
            status: true
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