const jwt = require("jsonwebtoken");
const { getEnv } = require("../config/env");
const signToken = (payload) => jwt.sign(payload, getEnv().jwt.secret, { expiresIn: getEnv().jwt.expiresIn });
const verifyToken = (token) => jwt.verify(token, getEnv().jwt.secret);
module.exports = { signToken, verifyToken };
