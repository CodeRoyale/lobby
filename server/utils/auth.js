// - Please fill these
const uuid = require('uuid');
const jwt = require('jsonwebtoken');

const encryptData = () => {
  //  TODO : pls fix this
  return uuid.v4();
};

const checkToken = (token) => {
  try {
    const decodedToken = jwt.decode(token);
    const payload = jwt.verify(
      token,
      process.env.ACCESS_SECRECT_KEY + decodedToken.userName
    );
    return payload;
  } catch (err) {
    return false;
  }
};

module.exports = {
  encryptData,
  checkToken,
};
