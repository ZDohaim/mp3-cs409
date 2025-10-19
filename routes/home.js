module.exports = function (router) {
  const User = require("../models/user");
  const Task = require("../models/task");

  var homeRoute = router.route("/");

  homeRoute.get(function (req, res) {
    var connectionString = process.env.TOKEN;
    res.json({ message: "My connection string is " + connectionString });
  });

  var usersRoute = router.route("/users");

  //parameters:
  usersRoute.get("/", async (req, res) => {
    try {
      const { where, sort, select, skip, limit, count } = req.query;

      let query = User.find();

      if (where) {
        const whereObj = JSON.parse(where);
        query = query.where(whereObj);
      }

      if (sort) {
        const sortObj = JSON.parse(sort);
        query = query.sort(sortObj);
      }

      if (select) {
        const selectObj = JSON.parse(select);
        query = query.select(selectObj);
      }

      if (skip) {
        query = query.skip(parseInt(skip));
      }

      if (limit) {
        query = query.limit(parseInt(limit));
      }

      if (count) {
        const result = await query.countDocuments();
        res.status(200).json({
          message: "OK",
          data: result,
        });
      } else {
        const users = await query.exc();
        res.status(200).json({
          message: "OK",
          data: users,
        });
      }
    } catch (error) {
      res.status(500).json({
        messsage: "Error getting users",
        data: error.message,
      });
    }
  });

  //POST	Create a new user. Respond with details of new user
  usersRoute.post(async function (req, res) {
    try {
      const newUser = new User(req.body);
      const savedUser = await newUser.findByIAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      res.status(201).json({
        message: "User created successfully",
        data: savedUser,
      });
    } catch (error) {
      res.status(400).json({
        message: "Error creating user",
        data: error.message,
      });
    }
  });

  var userRoute = router.route("/users/:id");
  //users/:id	GET	Respond with details of specified user or 404 error
  userRoute.get(async function (req, res) {
    try {
      const { select } = req.query;
      let query = User.findById(req.params.id);

      if (select) {
        const selectObj = JSON.parse(select);
        query = query.select(selectObj);
      }

      const user = await query.exec();

      if (!user) {
        return res.status(404).json({
          message: "User not found",
          data: null,
        });
      }

      res.status(200).json({
        message: "Ok",
        data: user,
      });
    } catch (error) {
      res.status(500).json({
        message: "Error getting user",
        data: error.message,
      });
    }
  });
  //	PUT	Replace entire user with supplied user or 404 error
  userRoute.put(async function (req, res) {
    try {
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      if (!updatedUser) {
        return res.status(404).json({
          message: "User not found",
          data: null,
        });
      }
      res.status(200).json({
        message: "User updates successfully",
        data: updatedUser,
      });
    } catch (error) {
      res.status(400).json({
        messaeg: "error updating user",
        data: error.message,
      });
    }
  });
  //DELETE	Delete specified user or 404 error
  userRoute.delete(async function (req, res) {
    try {
      const updatedUser = await User.findByIdAndDelete(req.params.id);
      if (!updatedUser) {
        return res.status(404).json({
          message: "User not found",
          data: null,
        });
      }
      res.status(200).json({
        message: "User deleted successfully",
        data: updatedUser,
      });
    } catch (error) {
      res.status(500).json({
        messaeg: "error deleting user",
        data: error.message,
      });
    }
  });
  return router;
};
