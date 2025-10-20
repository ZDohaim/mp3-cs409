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
        const users = await query.exec();
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
  usersRoute.post(async (req, res) => {
    try {
      const newUser = new User(req.body);
      const savedUser = await newUser.save();
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
  userRoute.get(async (req, res) => {
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
  userRoute.put(async (req, res) => {
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
  userRoute.delete(async (req, res) => {
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

  var tasksRoute = router.route("/tasks");

  //GET	Respond with a List of tasks
  tasksRoute.get("/", async (req, res) => {
    try {
      const { where, sort, select, skip, limit, count } = req.query;

      let query = Task.find();

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
        const task = await query.exec();
        res.status(200).json({
          message: "OK",
          data: task,
        });
      }
    } catch (error) {
      res.status(500).json({
        messsage: "Error getting users",
        data: error.message,
      });
    }
  });

  //POST Create a new task. Respond with details of new task
  tasksRoute.post(async (req, res) => {
    try {
      const newTask = new Task(req.body);
      const savedTask = await newTask.save();
      res.status(201).json({
        message: "new Task Created",
        data: savedTask,
      });
    } catch (error) {
      res.status(400).json({
        message: "failed to create task",
        data: error.message,
      });
    }
  });
  var taskRoute = router.route("/tasks/:id");

  //GET	Respond with details of specified task or 404 error
  taskRoute.get(async (req, res) => {
    try {
      const { select } = req.query;
      let query = Task.findById(req.params.id);

      if (select) {
        const selectObj = JSON.parse(select);
        query = query.select(selectObj);
      }

      const task = await query.exec();

      if (!task) {
        return res.status(404).json({
          message: "Task not found",
          data: null,
        });
      }
      res.status(200).json({
        message: "Task found successfully",
        data: task,
      });
    } catch (error) {
      res.status(404).json({
        message: "Error to get task",
        data: error.message,
      });
    }
  });
  //PUT	Replace entire task with supplied task or 404 error
  taskRoute.put(async (req, res) => {
    try {
      const updatedTask = await Task.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );
      res.status(201).json({
        message: "Accepted, replacing task",
        data: updatedTask,
      });
    } catch (error) {
      res.status(404).json({
        message: "Error replacing task",
        data: error.message,
      });
    }
  });
  //DELETE	Delete specified task or 404 error
  taskRoute.delete(async (req, res) => {
    try {
      const deleteTask = await Task.findByIdAndDelete(req.params.id);
      res.status(200).json({
        message: "deleted successfully",
        data: "",
      });
    } catch (error) {
      res.status(404).json({
        message: "Failed to delete task",
        data: error.message,
      });
    }
  });
  return router;
};
