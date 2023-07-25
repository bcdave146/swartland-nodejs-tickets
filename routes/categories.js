const express = require("express");

const validateObjectId = require("../middleware/validateObjectId");
const asyncMiddleware = require("../middleware/async");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const { Category, validateCategory } = require("../models/categories");
const router = express.Router();

// Setup CORS parameters
const corsOptions = {
  origin: "*",
  methods: ["GET", "PUT", "POST", "DELETE"],
};

router.get(
  "/",
  [auth],
  asyncMiddleware(async (req, res) => {
    const categories = await Category.find().sort("name");
    res.send(categories);
  })
);

// /api/category/1

router.get(
  "/:id",
  [auth],
  validateObjectId,
  asyncMiddleware(async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (!category)
      return res
        .status(404)
        .send("The Category with the given ID was not found!"); // 404 moved to error.js

    res.send(category);
  })
);

// App POST - use auth middleware function to verify user

router.post(
  "/",
  [auth, admin],
  asyncMiddleware(async (req, res) => {
    try {
      const { error } = validateCategory(req.body);
      if (error) return res.status(400).send(error.details[0].message); // 400 Bad Request

      let category = new Category({
        name: req.body.name,
        color: req.body.color,
      });
      category = await category.save();
      res.send(category);
    } catch (error) {
      // Check if the error is a duplicate key error
      if (error.code === 11000) {
        return res
          .status(400)
          .send("Duplicate record. Category or Color already exists.");
      }

      // Handle other errors
      console.error(error);
      res.status(500).send("An unexpected error occurred.");
    }
  })
);

// App PUT

router.put("/:id", [auth, admin], async (req, res) => {
  try {
    // Validate
    // If invalid, return 400 - Bad request
    const { error } = validateCategory(req.body);
    if (error) return res.status(400).send(error.details[0].message); // 400 Bad Request

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        color: req.body.color,
      },
      {
        new: true,
      }
    );
    // Update category
    // Return the updated category
    if (!category) {
      return res
        .status(404)
        .send("The category with the given ID was not found!"); // 404
    }

    res.send(category);
  } catch (error) {
    // Check if the error is a duplicate key error
    if (error.code === 11000) {
      return res
        .status(400)
        .send("Duplicate record. Name or color already exists.");
    }

    // Handle other errors
    console.error(error);
    res.status(500).send("An unexpected error occurred.");
  }
});

// App HTTP DELETE
// parameters path, middleware, req, res, next
router.delete("/:id", [auth, admin], async (req, res) => {
  // Look up the category
  // Not existing, return 404
  const category = await Category.findByIdAndRemove(req.params.id);
  if (!category)
    return res
      .status(404)
      .send("The category with the given ID was not found!"); // 404

  // Return the same category
  res.send(category);
});

module.exports = router;
