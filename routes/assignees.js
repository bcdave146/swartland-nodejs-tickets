const express = require("express");

const validateObjectId = require("../middleware/validateObjectId");
const asyncMiddleware = require("../middleware/async");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const { Assignee, validateAssignee } = require("../models/assignees");
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
    const assignees = await Assignee.find().sort("name");
    res.send(assignees);
  })
);

// /api/assignee/1

router.get(
  "/:id",
  [auth],
  validateObjectId,
  asyncMiddleware(async (req, res) => {
    const assignee = await Assignee.findById(req.params.id);

    if (!assignee)
      return res
        .status(404)
        .send("The Assignee with the given ID was not found!"); // 404 moved to error.js

    res.send(assignee);
  })
);

// App POST - use auth middleware function to verify user

router.post(
  "/",
  [auth, admin],
  asyncMiddleware(async (req, res) => {
    try {
      const { error } = validateAssignee(req.body);
      if (error) return res.status(400).send(error.details[0].message); // 400 Bad Request

      let assignee = new Assignee({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        active: req.body.active,
      });
      assignee = await assignee.save();
      res.send(assignee);
    } catch (error) {
      // Check if the error is a duplicate key error
      if (error.code === 11000) {
        return res.status(400).send("Duplicate record. Email already exists.");
      }

      // Handle other errors
      console.error(error);
      res.status(500).send("An unexpected error occurred.");
    }
  })
);

// App PUT

router.put("/:id", [auth, admin], async (req, res) => {
  // Validate
  // If invalid, return 400 - Bad request
  const { error } = validateAssignee(req.body);
  if (error) return res.status(400).send(error.details[0].message); // 400 Bad Request

  const assignee = await Assignee.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      active: req.body.active,
    },
    {
      new: true,
    }
  );
  // Update assignee
  // Return the updated assignee
  if (!assignee)
    return res
      .status(404)
      .send("The assignee with the given ID was not found!"); // 404

  res.send(assignee);
});

// App HTTP DELETE
// parameters path, middleware, req, res, next
router.delete("/:id", [auth, admin], async (req, res) => {
  // Look up the assignee
  // Not existing, return 404
  const assignee = await Assignee.findByIdAndRemove(req.params.id);
  if (!assignee)
    return res
      .status(404)
      .send("The assignee with the given ID was not found!"); // 404

  // Return the same assignee
  res.send(assignee);
});

module.exports = router;
