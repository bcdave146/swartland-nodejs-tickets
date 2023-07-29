const express = require("express");

const validateObjectId = require("../middleware/validateObjectId");
const asyncMiddleware = require("../middleware/async");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const { Location, validateLocation } = require("../models/locations");
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
    const locations = await Location.find().sort("name");
    res.send(locations);
  })
);

// /api/location/1

router.get(
  "/:id",
  [auth],
  validateObjectId,
  asyncMiddleware(async (req, res) => {
    const location = await Location.findById(req.params.id);

    if (!location)
      return res
        .status(404)
        .send("The Location with the given ID was not found!"); // 404 moved to error.js

    res.send(location);
  })
);

// App POST - use auth middleware function to verify user

router.post(
  "/",
  [auth],
  asyncMiddleware(async (req, res) => {
    try {
      const { error } = validateLocation(req.body);
      if (error) return res.status(400).send(error.details[0].message); // 400 Bad Request

      let location = new Location({
        name: req.body.name,
        color: req.body.color,
      });
      location = await location.save();
      res.send(location);
    } catch (error) {
      // Check if the error is a duplicate key error
      if (error.code === 11000) {
        return res
          .status(400)
          .send("Duplicate record. Location already exists.");
      }

      // Handle other errors
      console.error(error);
      res.status(500).send("An unexpected error occurred.");
    }
  })
);

// App PUT

router.put("/:id", [auth], async (req, res) => {
  try {
    // Validate
    // If invalid, return 400 - Bad request
    const { error } = validateLocation(req.body);
    if (error) return res.status(400).send(error.details[0].message); // 400 Bad Request

    const location = await Location.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        color: req.body.color,
      },
      {
        new: true,
      }
    );
    // Update location
    // Return the updated location
    if (!location) {
      return res
        .status(404)
        .send("The location with the given ID was not found!"); // 404
    }

    res.send(location);
  } catch (error) {
    // Check if the error is a duplicate key error
    if (error.code === 11000) {
      return res.status(400).send("Duplicate record. Name already exists.");
    }

    // Handle other errors
    console.error(error);
    res.status(500).send("An unexpected error occurred.");
  }
});

// App HTTP DELETE
// parameters path, middleware, req, res, next
router.delete("/:id", [auth, admin], async (req, res) => {
  // Look up the location
  // Not existing, return 404
  const location = await Location.findByIdAndRemove(req.params.id);
  if (!location)
    return res
      .status(404)
      .send("The location with the given ID was not found!"); // 404

  // Return the same location
  res.send(location);
});

module.exports = router;
