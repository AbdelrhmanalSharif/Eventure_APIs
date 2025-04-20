//checks eza company eza tole3 admin menseer bkamel el request
module.exports = function isCompany(req, res, next) {
    if (req.user.userType !== 'Company') {
      return res.status(403).json({ message: 'Access denied. Company users only.' });
    }
    next();
  };
  