const express = require("express");

const validateObjectId = require("../middleware/validateObjectId");
const asyncMiddleware = require("../middleware/async");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const { State, validateState } = require("../models/states");
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
    const states = await State.find().sort("name");
    res.send(states);
  })
);

// /api/state/1

router.get(
  "/:id",
  [auth],
  validateObjectId,
  asyncMiddleware(async (req, res) => {
    const state = await State.findById(req.params.id);

    if (!state)
      return res.status(404).send("The State with the given ID was not found!"); // 404 moved to error.js

    res.send(state);
  })
);

// App POST - use auth middleware function to verify user

router.post(
  "/",
  [auth, admin],
  asyncMiddleware(async (req, res) => {
    try {
      const { error } = validateState(req.body);
      if (error) return res.status(400).send(error.details[0].message); // 400 Bad Request

      let state = new State({
        name: req.body.name,
        color: req.body.color,
      });
      state = await state.save();
      res.send(state);
    } catch (error) {
      // Check if the error is a duplicate key error
      if (error.code === 11000) {
        return res
          .status(400)
          .send("Duplicate record. State or Color already exists.");
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
    const { error } = validateState(req.body);
    if (error) return res.status(400).send(error.details[0].message); // 400 Bad Request

    const state = await State.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        color: req.body.color,
      },
      {
        new: true,
      }
    );
    // Update state
    // Return the updated state
    if (!state) {
      return res.status(404).send("The state with the given ID was not found!"); // 404
    }

    res.send(state);
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
  // Look up the state
  // Not existing, return 404
  const state = await State.findByIdAndRemove(req.params.id);
  if (!state)
    return res.status(404).send("The state with the given ID was not found!"); // 404

  // Return the same state
  res.send(state);
});

module.exports = router;
