const express = require('express');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { ensureAuth } = require('../middlewares/ensureAuth');
const User = require('../db/models/User');

const router = express.Router();

//@route POST /v1/auth/signup
//@desc Create a new user from given data

router.post('/signup', async (req, res) => {

    try {
        
        req.body.name = req.body.name.trim();
        req.body.email = req.body.email.trim();
        req.body.password = req.body.password.trim();

        let errors = [];

        if(req.body.name.length < 2) {

            errors.push({
                param: "name",
                message: "Name should be at least 2 characters.",
                code: "INVALID_INPUT"
            });
        }

        if(!validator.isEmail(req.body.email)) {

            errors.push({
                param: "email",
                message: "Please provide a valid email address.",
                code: "INVALID_INPUT"
            });
        }
        else {

            const user = await User.findOne({email: req.body.email});

            if(user) {

                errors.push({
                    param: "email",
                    message: "User with this email address already exists.",
                    code: "RESOURCE_EXISTS"
                });
            }
        }

        if(req.body.password.length < 6) {

            errors.push({
                param: "password",
                message: "Password should be at least 6 characters.",
                code: "INVALID_INPUT"
            });
        }

        if(errors.length >= 1) {

            res.status(400).json({
                status: false,
                errors
            });

            return;
        }

        const newUser = new User(req.body);

        let createdUser = await newUser.save();

        //Generating jwt access token

        const access_token = jwt.sign(createdUser._id, process.env.JWT_SECRET);

        createdUser = createdUser.toObject();

        delete createdUser.password;
        delete createdUser.updated_at;
        delete createdUser.__v;

        res.status(200).json({
            status: true,
            content: {
                data: createdUser,
                meta: {
                    access_token
                }
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

//@Route POST /v1/auth/signin
//@desc Sign in user from the valid credentials and generate access token

router.post('/signin', async (req, res) => {

    try {
        
        req.body.email = req.body.email.trim();
        req.body.password = req.body.password.trim();

        let errors = [];

        if(!validator.isEmail(req.body.email)) {

            errors.push({
                param: "email",
                message: "Please provide a valid email address.",
                code: "INVALID_INPUT"
            });
        }

        if(req.body.password.length < 6) {

            errors.push({
                param: "password",
                message: "Password should be at least 6 characters.",
                code: "INVALID_INPUT"
            });
        }

        if(errors.length >= 1) {

            res.status(400).json({
                status: false,
                errors
            });

            return;
        }

        const user = await User.findOne({email: req.body.email}).lean();

        if(!user) {

            errors.push({
                param: "email",
                message: "The credentials you provided are invalid.",
                code: "INVALID_CREDENTIALS"
            });
        }
        else {

            //Comparing hash of the password with the given password

            const isMatch = await bcrypt.compare(req.body.password, user.password);

            if(!isMatch) {

                errors.push({
                    param: "password",
                    message: "The credentials you provided are invalid.",
                    code: "INVALID_CREDENTIALS"
                });
            }
        }

        if(errors.length >= 1) {

            res.status(400).json({
                status: false,
                errors
            });

            return;
        }

        //Generating jwt access token for the user

        const access_token = jwt.sign(user._id, process.env.JWT_SECRET);

        delete user.password;
        delete user.updated_at;
        delete user.__v;

        res.status(200).json({
            status: true,
            content: {
                data: user,
                meta: {
                    access_token
                }
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

//@Route GET /v1/auth/me 
//auth header required
//@desc Return the details of currently signed in user

router.get('/me', ensureAuth, async (req, res) => {

    try {
        
        if(req._id === undefined) {

            return;
        }

        const user = await User.findOne({ _id: req._id }, {password: 0, updated_at: 0, __v: 0 }).lean();

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

        res.status(200).json({
            status: true,
            content: {
                data: user
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