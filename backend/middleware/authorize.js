function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Reikia prisijungti."
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Neturite teisės atlikti šio veiksmo."
      });
    }

    return next();
  };
}

module.exports = authorize;