const express = require('express');
const router = express.Router();
const Role = require('../db/models/Role');

//@Route POST /v1/role
//@desc Create a new role from given data

router.post('/', async (req, res) => {

    try {
        
        let errors = [];

        req.body.name = req.body.name.trim();

        const role = await Role.findOne({name: req.body.name});

        if(role) {

            errors.push({
                param: "name",
                message: "The role already exists.",
                code: "RESOURCE_EXISTS"
            });
        }

        if(req.body.name.length < 2) {

            errors.push({
                param: "name",
                message: "Name should be at least 2 characters.",
                code: "INVALID_INPUT"
            })
        }

        if(errors.length >= 1) {

            res.status(400).json({
                status: false,
                errors
            });

            return;
        }

        const newRole = new Role(req.body);

        let createdRole = await newRole.save();

        createdRole = createdRole.toObject();

        delete createdRole['__v'];
        delete createdRole['scopes'];

        res.status(200).json({
            status: true,
            content: {
                data: createdRole
            }
        });

    } catch (error) {
        
        console.error(error);

        res.status(500).json({
            status: false,
            errors: [{
                message: "Some internal server error occured.",
            }]
        });
    }
});

//@Route GET /v1/role
//@desc List all the roles

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

        let roles = await Role.find().lean();

        const total = roles.length;
        const pages = Math.ceil(total/pageSize);

        const skip = (page - 1)*pageSize;

        roles = await Role.find({}, {__v: 0}).skip(skip).limit(pageSize).lean();

        res.status(200).json({
            status: true,
            content: {
                meta: {
                    total,
                    pages,
                    page
                },
                data: roles
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