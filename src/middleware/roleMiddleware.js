exports.allowRoles = (...roles) => {
  return (req, res, next) => {
    console.log("User role:", req.user.role?.roleName);
    if (!req.user || !roles.includes(req.user.role?.roleName?.toLowerCase())) {
      return res.status(403).json({
        success: false,
        message: "Permission denied",
      });
    }

    next();
  };
};
