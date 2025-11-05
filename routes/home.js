module.exports = function (router) {
  const User = require("../models/user");
  const Task = require("../models/task");

  var homeRoute = router.route("/");

  homeRoute.get(function (req, res) {
    var connectionString = process.env.TOKEN;
    res.json({ message: "My connection string is " + connectionString });
  });

  return router;
};
