const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const express = require("express");

const { Product, validateProduct } = require("../models/products");

const { Instructor } = require("../models/instructors");

const { Enrollment } = require("../models/enrollments");
const router = express.Router();

router.get("/", async (req, res) => {
  const products = await Product.find().sort("name");
  res.send(products);
});

// /api/products/:id

router.get("/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product)
    return res.status(404).send("The request with the given ID was not found!"); // 404
  res.send(product);
});

// App POST

router.post("/", auth, async (req, res) => {
  const { error } = validateProduct(req.body);
  if (error) return res.status(400).send(error.details[0].message); // 400 Bad Request

  const instructor = await Instructor.findById(req.body.instructorId);
  if (!instructor) return res.status(400).send("Invalid instructor request.");

  const product = new Product({
    productCode: req.body.productCode,
    name: req.body.name,
    description: req.body.description,
    instructor: {
      _id: instructor._id,
      name: instructor.name,
      email: instructor.email,
      address: instructor.address,
      phone: instructor.phone,
    },
    numberInStock: req.body.numberInStock,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    productPrice: req.body.productPrice,
    active: req.body.active,
  });
  try {
    await product.save();

    res.send(product);
  } catch (error) {
    console.log("Error saving the product : ", error.message);
  }
});

// App PUT

router.put("/:id", auth, async (req, res) => {
  // Validate
  // If invalid, return 400 - Bad request
  const { error } = validateProduct(req.body);
  if (error) return res.status(400).send(error.details[0].message); // 400 Bad Request

  const instructor = await Instructor.findById(req.body.instructorId);
  if (!instructor) return res.status(400).send("Invalid instructor.");

  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        productCode: req.body.productCode,
        name: req.body.name,
        description: req.body.description,
        instructor: {
          _id: instructor._id,
          name: instructor.name,
          email: instructor.email,
          address: instructor.address,
          phone: instructor.phone,
        },
        numberInStock: req.body.numberInStock,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        productPrice: req.body.productPrice,
        active: req.body.active,
      },
      { new: true }
    );

    // Update product
    // Return the updated product
    if (!product)
      return res
        .status(404)
        .send("The product with the given ID was not found!"); // 404

    res.send(product);
  } catch (error) {
    console.log("Error updating the product : ", error.message);
  }
});

// App HTTP DELETE

router.delete("/:id", [auth, admin], async (req, res) => {
  // Look up the products
  // DA 02 03 2023 Add check if Product has a enrollment, if yes then don't delete.
  // Added enrollmentLookupProduct in model/enrollments.js
  //
  const enrollment = await Enrollment.enrollmentLookupProduct(req.params.id);

  if (enrollment)
    return res
      .status(400)
      .send(
        "Product has a enrollment unable to process, close out enrollment then you able to delete."
      );

  // Not existing, return 404
  const product = await Product.findByIdAndRemove(req.params.id);
  if (!product)
    return res.status(404).send("The product with the given ID was not found!"); // 404

  // Return the same genre
  res.send(product);
});

module.exports = router;
