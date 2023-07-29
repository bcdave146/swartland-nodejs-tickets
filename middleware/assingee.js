// 401 Unauthorized
// 403 Forbidden

module.exports = function (req, res, next) {
  if (!req.user.isAssignee)
    return res.status(403).send("Not a assignee user access denied.");

  next();
};
