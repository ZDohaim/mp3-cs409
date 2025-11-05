module.exports = function (router) {
  const User = require("../models/user");
  const Task = require("../models/task");
  var usersRoute = router.route("/users");

  //parameters:
  usersRoute.get(async (req, res) => {
    try {
      const { where, sort, select, skip, limit, count } = req.query;

      let query = User.find();

      if (where) {
        try {
          const whereObj = JSON.parse(where);
          query = query.where(whereObj);
        } catch (e) {
          return res.status(400).json({
            message: "Invalid JSON in where parameter",
            data: null,
          });
        }
      }

      if (count) {
        // For count, only apply where filter, not limit/skip/sort/select
        const result = await query.countDocuments();
        return res.status(200).json({
          message: "OK",
          data: result,
        });
      }

      if (sort) {
        try {
          const sortObj = JSON.parse(sort);
          query = query.sort(sortObj);
        } catch (e) {
          return res.status(400).json({
            message: "Invalid JSON in sort parameter",
            data: null,
          });
        }
      }

      if (select) {
        try {
          const selectObj = JSON.parse(select);
          query = query.select(selectObj);
        } catch (e) {
          return res.status(400).json({
            message: "Invalid JSON in select parameter",
            data: null,
          });
        }
      }

      if (skip) {
        query = query.skip(parseInt(skip));
      }

      if (limit) {
        query = query.limit(parseInt(limit));
      }

      const users = await query.exec();
      res.status(200).json({
        message: "OK",
        data: users,
      });
    } catch (error) {
      res.status(500).json({
        message: "Error getting users",
        data: null,
      });
    }
  });

  //POST	Create a new user. Respond with details of new user
  usersRoute.post(async (req, res) => {
    try {
      const user = await User.create(req.body);
      res.status(201).json({ message: "User created", data: user });
    } catch (err) {
      if (err.name === "ValidationError") {
        const firstError = Object.values(err.errors)[0].message;
        return res.status(400).json({ message: firstError, data: null });
      }
      if (err.code === 11000) {
        return res.status(400).json({ message: "Duplicate email", data: null });
      }
      res.status(500).json({ message: "Error creating user", data: null });
    }
  });

  var userRoute = router.route("/users/:id");
  //users/:id	GET	Respond with details of specified user or 404 error
  userRoute.get(async (req, res) => {
    try {
      const { select } = req.query;
      let query = User.findById(req.params.id);

      if (select) {
        try {
          const selectObj = JSON.parse(select);
          query = query.select(selectObj);
        } catch (e) {
          return res.status(400).json({
            message: "Invalid JSON in select parameter",
            data: null,
          });
        }
      }

      const user = await query.exec();

      if (!user) {
        return res.status(404).json({
          message: "User not found",
          data: null,
        });
      }

      res.status(200).json({
        message: "OK",
        data: user,
      });
    } catch (error) {
      res.status(404).json({
        message: "User not found",
        data: null,
      });
    }
  });
  //	PUT	Replace entire user with supplied user or 404 error
  userRoute.put(async (req, res) => {
    try {
      const oldUser = await User.findById(req.params.id);

      if (!oldUser) {
        return res.status(404).json({
          message: "User not found",
          data: null,
        });
      }

      // Check for conflicts if pendingTasks is being updated
      if (req.body.hasOwnProperty("pendingTasks") && Array.isArray(req.body.pendingTasks)) {
        const newTaskIds = req.body.pendingTasks;

        // Check if any of these tasks are already assigned to another user
        for (const taskId of newTaskIds) {
          const otherUser = await User.findOne({
            _id: { $ne: req.params.id },
            pendingTasks: taskId,
          });
          if (otherUser) {
            return res.status(400).json({
              message: "The task is already assigned to another user",
              data: null,
            });
          }
        }
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      // Handle two-way reference for pendingTasks
      if (req.body.hasOwnProperty("pendingTasks")) {
        // Remove this user from tasks that are no longer in pendingTasks
        const oldTaskIds = oldUser.pendingTasks || [];
        const newTaskIds = req.body.pendingTasks || [];
        const removedTaskIds = oldTaskIds.filter(
          (id) => !newTaskIds.includes(id)
        );

        if (removedTaskIds.length > 0) {
          await Task.updateMany(
            { _id: { $in: removedTaskIds } },
            { assignedUser: "", assignedUserName: "unassigned" }
          );
        }

        // Assign this user to tasks in the new pendingTasks (only if not completed)
        if (Array.isArray(req.body.pendingTasks) && req.body.pendingTasks.length > 0) {
          await Task.updateMany(
            {
              _id: { $in: req.body.pendingTasks },
              completed: false,
            },
            {
              assignedUser: req.params.id,
              assignedUserName: updatedUser.name,
            }
          );
        }
      }

      res.status(200).json({
        message: "User updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      res.status(400).json({
        message: "Error updating user",
        data: null,
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
      //DELETE a User should unassign the user's pending tasks
      await Task.updateMany(
        { assignedUser: req.params.id },
        { assignedUser: "", assignedUserName: "unassigned" }
      );
      res.status(204).send();
    } catch (error) {
      res.status(500).json({
        message: "Error deleting user",
        data: null,
      });
    }
  });
  return router;
};
