const jwt = require('jsonwebtoken');
const config = require('./config');

const authJwt = {};

verifyToken = (req, res, next) => {
	let token = req.headers['x-access-token'];
  
	if (!token){
		return res.status(403).send({ 
			auth: false, message: 'No token provided.' 
		});
	}
 
	jwt.verify(token, config.TOKEN_SECRET, (err, decoded) => {
		if (err){
			return res.status(500).send({ 
					auth: false, 
					message: 'Fail to Authentication. Error -> ' + err 
				});
		}
		req.userId = decoded.id;
		next();
	});
}

authJwt.verifyToken = verifyToken;
module.exports = authJwt;