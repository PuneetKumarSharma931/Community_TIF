const jwt = require('jsonwebtoken');

module.exports = {
    ensureAuth: async (req, res, next) => {

        try {
            
            //getting authorization header
            const authHeader = req.headers.authorization;

            if(!authHeader) {

                res.status(401).json({
                    status: false,
                    errors: [{
                        message: "You need to sign in to proceed.",
                        code: "NOT_SIGNEDIN"
                    }]
                });

                return;
            }

            //getting access token from auth header
            const access_token = authHeader.split(' ')[1];

            if(!access_token) {

                res.status(401).json({
                    status: false,
                    errors: [{
                        message: "You need to sign in to proceed.",
                        code: "NOT_SIGNEDIN"
                    }]
                });

                return;
            }

            //decoding the jwt token and checking whether it is valid or not
            jwt.verify(access_token, process.env.JWT_SECRET, (error, decodedToken) => {

                if(error) {

                    res.status(401).json({
                        status: false,
                        errors: [{
                            message: "You need to sign in to proceed.",
                            code: "NOT_SIGNEDIN"
                        }]
                    });
    
                    return;
                }

                req._id = decodedToken;

                next();
            });

        } catch (error) {
            
            throw new Error(error);
        }
    }
}