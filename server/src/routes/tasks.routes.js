const express = require("express");
const mongoose = require("mongoose");
const { z } = require("zod");

const Task = require("../models/Task");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(requireAuth);

// Validation schemas
const taskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  category: z.enum(["Personal", "Work", "Study"]).optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    category: z.enum(["Personal", "Work", "Study"]).optional(),
    completed: z.boolean().optional(),
    dueDate: z.string().datetime().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update.",
  });

const querySchema = z.object({
  search: z.string().max(200).optional().default(""),
  category: z
    .enum(["All", "Personal", "Work", "Study"])
    .optional()
    .default("All"),
  status: z.enum(["All", "Pending", "Completed"]).optional().default("All"),
  sort: z
    .enum(["newest", "oldest", "alphabetical"])
    .optional()
    .default("newest"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

function validId(id) {
  return mongoose.isValidObjectId(id);
}

// Escape regex special characters so search input is treated as text.
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET /api/tasks
// Supports search, filters, sorting, and pagination.
router.get("/", async (req, res, next) => {
  try {
    const parsedQuery = querySchema.safeParse(req.query);

    if (!parsedQuery.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid task query parameters.",
        errors: parsedQuery.error.flatten(),
      });
    }

    const { search, category, status, sort, page, limit } = parsedQuery.data;

    // Always scope queries to the authenticated user.
    const filter = {
      owner: req.userId,
    };

    if (search.trim()) {
      filter.title = {
        $regex: escapeRegex(search.trim()),
        $options: "i",
      };
    }

    if (category !== "All") {
      filter.category = category;
    }

    if (status === "Completed") {
      filter.completed = true;
    } else if (status === "Pending") {
      filter.completed = false;
    }

    const sortOptions = {
      newest: { createdAt: -1, _id: -1 },
      oldest: { createdAt: 1, _id: 1 },
      alphabetical: { title: 1, _id: 1 },
    };

    const skip = (page - 1) * limit;

    const [tasks, totalTasks] = await Promise.all([
      Task.find(filter).sort(sortOptions[sort]).skip(skip).limit(limit).lean(),

      Task.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalTasks / limit);

    res.status(200).json({
      success: true,
      tasks,
      pagination: {
        page,
        limit,
        totalTasks,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/tasks
router.post("/", async (req, res, next) => {
  try {
    const parsed = taskSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid task data.",
        errors: parsed.error.flatten(),
      });
    }

    const task = await Task.create({
      ...parsed.data,
      dueDate: parsed.data.dueDate ?? null,
      owner: req.userId,
    });

    res.status(201).json({
      success: true,
      task,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/tasks/:id
router.patch("/:id", async (req, res, next) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    const parsed = updateTaskSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid task update.",
        errors: parsed.error.flatten(),
      });
    }

    const updates = { ...parsed.data };

    if (updates.dueDate !== undefined) {
      updates.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
    }

    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        owner: req.userId,
      },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    res.json({
      success: true,
      task,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/tasks/:id
router.delete("/:id", async (req, res, next) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.userId,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    res.json({
      success: true,
      message: "Task deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
