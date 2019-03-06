
const jwt 		= require('jsonwebtoken');
const env 		= require('dotenv').config({path:'./config/.env'}).parsed;
const jwtDecode = require('jwt-decode');

module.exports = (req, res, next) => {
	const authHeader = req.headers["authorization"] || req.query.token;

	if (!authHeader)
		return res.status(403 ).send({ error: 'No token provided' });

	const parts = authHeader.split(' ');

	if (!parts.length === 2)
		return res.status(401).send({ error: 'Token error' });

	const [ scheme, token ] = parts;

	jwt.verify(parts[0], env.SECRET_KEY, (error, decoded) => {
		if (error)
			return res.status(401).send({ error: 'Token invalid' });
			req.payload = decoded.payload;
			return next();
	});
};