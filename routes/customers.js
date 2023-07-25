const express = require("express");
const asyncMiddleware = require("../middleware/async");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const { Customer, validateCustomers } = require("../models/customers");
const { Category, categorySchema } = require("../models/categories");
const Counter = require("../models/counter");
const router = express.Router();

// The Routes start here

router.get(
  "/",
  [auth],
  asyncMiddleware(async (req, res) => {
    const customers = await Customer.find().sort("name");
    res.send(customers);
  })
);

// /api/customers/:id

router.get(
  "/:id",
  [auth],
  asyncMiddleware(async (req, res) => {
    const customer = await Customer.findById(req.params.id);

    if (!customer)
      return res
        .status(404)
        .send("The customer with the given ID was not found!"); // 404
    res.send(customer);
  })
);

// App POST

router.post(
  "/",
  [auth],
  asyncMiddleware(async (req, res) => {
    const { error } = validateCustomers(req.body);
    if (error) return res.status(400).send(error.details[0].message); // 400 Bad Request

    // Get Counter

    const counter = await Counter.findByIdAndUpdate(
      { _id: "customerNumber" },
      { $inc: { sequence_value: 1 } },
      { new: true, upsert: true }
    );

    const customerNumber = counter.sequence_value.toString().padStart(7, "0");

    // Validate the ticket number to be within the desired range
    if (parseInt(customerNumber) >= 10000000) {
      return res
        .status(400)
        .send("Customer number exceeds the maximum allowed limit.");
    }

    // Check Id's
    const categoryIds = req.body.categories;
    if (categoryIds.length > 0) {
      const validCategories = await Category.find({
        _id: { $in: categoryIds },
      }).lean();
      if (validCategories.length !== categoryIds.length) {
        return res.status(400).send("Invalid category IDs");
      }
    }

    const customer = new Customer({
      customerNumber,
      name: req.body.name,
      contact: req.body.contact,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      comments: req.body.comments,
      active: req.body.active,
      clickUpActive: req.body.clickUpActive,
      gitHubActive: req.body.gitHubActive,
      categories: categoryIds,
    });

    try {
      savedCustomer = await customer.save();
      res.send(savedCustomer);
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).send("Duplicate record");
      }
      console.error(error);
      res.status(500).send("An unexpected error occurred.");
    }
  })
);

// App PUT

router.put("/:id", async (req, res) => {
  // Validate
  // If invalid, return 400 - Bad request
  const { error } = validateCustomers(req.body);
  if (error) return res.status(400).send(error.details[0].message); // 400 Bad Request

  // Validate categories
  const categoryIds = req.body.categories;
  const validCategories = await Category.find({
    _id: { $in: categoryIds },
  }).lean();
  if (validCategories.length !== categoryIds.length) {
    return res.status(400).send("Invalid category IDs");
  }

  const customer = await Customer.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      contact: req.body.contact,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      comments: req.body.comments,
      active: req.body.active,
      clickUpActive: req.body.clickUpActive,
      gitHubActive: req.body.gitHubActive,
      categories: categoryIds,
    },
    {
      new: true,
    }
  );

  // Update customer
  // Return the updated customer
  if (!customer)
    return res
      .status(404)
      .send("The customer with the given ID was not found!"); // 404

  res.send(customer);
});

// App HTTP DELETE

module.exports = router;
