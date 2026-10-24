const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const token = req.cookies?.onesphere_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Please log in to continue.',
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = payload.sub;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Your session is invalid or expired. Please log in again.',
    });
  }
}

module.exports = { requireAuth };