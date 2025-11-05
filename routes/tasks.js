module.exports = function (router) {
  const Task = require("../models/task");
  const User = require("../models/user");

  var tasksRoute = router.route("/tasks");

  //GET	Respond with a List of tasks
  tasksRoute.get(async (req, res) => {
    try {
      const { where, sort, select, skip, limit, count } = req.query;

      let query = Task.find();

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
      } else {
        query = query.limit(100); // Default limit for tasks
      }

      const task = await query.exec();
      res.status(200).json({
        message: "OK",
        data: task,
      });
    } catch (error) {
      res.status(500).json({
        message: "Error getting tasks",
        data: null,
      });
    }
  });

  //POST Create a new task. Respond with details of new task
  tasksRoute.post(async (req, res) => {
    try {
      const task = await Task.create(req.body);
      res.status(201).json({ message: "Task created", data: task });
    } catch (err) {
      if (err.name === "ValidationError") {
        const firstError = Object.values(err.errors)[0].message;
        return res.status(400).json({ message: firstError, data: null });
      }
      res.status(500).json({ message: "Error creating task", data: null });
    }
  });
  var taskRoute = router.route("/tasks/:id");

  //GET	Respond with details of specified task or 404 error
  taskRoute.get(async (req, res) => {
    try {
      const { select } = req.query;
      let query = Task.findById(req.params.id);

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
        message: "Task not found",
        data: null,
      });
    }
  });
  //PUT	Replace entire task with supplied task or 404 error
  taskRoute.put(async (req, res) => {
    try {
      const oldTask = await Task.findById(req.params.id);

      if (!oldTask) {
        return res.status(404).json({
          message: "Task not found",
          data: null,
        });
      }

      // Check for conflict if assignedUser is being changed
      if (req.body.hasOwnProperty("assignedUser") && req.body.assignedUser !== "" && req.body.assignedUser !== oldTask.assignedUser) {
        const conflictingUser = await User.findById(req.body.assignedUser);
        if (conflictingUser && conflictingUser.pendingTasks.includes(req.params.id)) {
          // Task is already in this user's pending tasks, which is fine
        } else {
          // Check if this task is assigned to another user
          const taskInOtherUser = await User.findOne({
            _id: { $ne: req.body.assignedUser },
            pendingTasks: req.params.id,
          });
          if (taskInOtherUser) {
            return res.status(400).json({
              message: "The task is already assigned to another user",
              data: null,
            });
          }
        }
      }

      const updatedTask = await Task.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );

      // Remove task from old user's pendingTasks if user has changed
      if (oldTask.assignedUser && oldTask.assignedUser !== "") {
        await User.findByIdAndUpdate(oldTask.assignedUser, {
          $pull: { pendingTasks: req.params.id },
        });
      }

      // Add task to new user's pendingTasks only if not completed
      if (
        updatedTask.assignedUser &&
        updatedTask.assignedUser !== "" &&
        !updatedTask.completed
      ) {
        await User.findByIdAndUpdate(updatedTask.assignedUser, {
          $addToSet: { pendingTasks: updatedTask._id },
        });
      }

      res.status(200).json({
        message: "Task updated successfully",
        data: updatedTask,
      });
    } catch (error) {
      res.status(404).json({
        message: "Error replacing task",
        data: null,
      });
    }
  });
  //DELETE	Delete specified task or 404 error
  taskRoute.delete(async (req, res) => {
    try {
      const deleteTask = await Task.findByIdAndDelete(req.params.id);
      if (!deleteTask) {
        return res.status(404).json({
          message: "Task not found",
          data: null,
        });
      }

      // Remove task from assigned user's pendingTasks
      if (deleteTask.assignedUser && deleteTask.assignedUser !== "") {
        await User.findByIdAndUpdate(deleteTask.assignedUser, {
          $pull: { pendingTasks: req.params.id },
        });
      }

      res.status(204).send();
    } catch (error) {
      res.status(404).json({
        message: "Failed to delete task",
        data: null,
      });
    }
  });
  return router;
};
