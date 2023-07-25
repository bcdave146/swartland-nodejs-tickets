// Create a new enrollment
// POST /api/enrollments
// record customer, product, enrollment date, decrease stock
// verify number in to enroll, if no fail

// Get the list of enrollments
// GET /api/enrollments
const express = require("express");
const mongoose = require("mongoose");

const { Enrollment, validateEnrollment } = require("../models/enrollments");
const { Product } = require("../models/products");
const { Customer } = require("../models/customers");
const auth = require("../middleware/auth");
const router = express.Router();

// DA 1 April 2023 All Enrollments completed, not completed, paid, not paid
router.get("/all", async (req, res) => {
  const enrollments = await Enrollment.find().sort("-enrollmentDate");

  res.send(enrollments);
});

// DA 1 April 2023 All Enrollments not completed, paid and not paid
router.get("/", async (req, res) => {
  const enrollments = await Enrollment.find({
    completionDate: { $exists: false },
  }).sort("-enrollmentDate");

  res.send(enrollments);
});

// DA 1 April 2023 Enrollments not completed not paid
router.get("/_enrolledNotCompletedNotPaid", async (req, res) => {
  const enrollments = await Enrollment.find({
    completionDate: { $exists: false },
    enrollmentPaid: false,
  }).sort("-enrollmentDate");

  res.send(enrollments);
});

// DA 1 April 2023 Enrollments Completed and Paid
router.get("/_completedPaid", async (req, res) => {
  const enrollments = await Enrollment.find({
    completionDate: { $exists: true },
    enrollmentPaid: true,
  }).sort("-enrollmentDate");

  res.send(enrollments);
});

router.get("/_completedNotPaid", async (req, res) => {
  const enrollments = await Enrollment.find({
    completionDate: { $exists: true },
    enrollmentPaid: false,
  }).sort("-enrollmentDate");

  res.send(enrollments);
});

// DA 01 04 20223 All Enrollments Paid
router.get("/_enrollmentsPaid", async (req, res) => {
  const enrollments = await Enrollment.find({
    enrollmentPaid: true,
  }).sort("-enrollmentDate");

  res.send(enrollments);
});

router.post("/", auth, async (req, res) => {
  const { error } = validateEnrollment(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const customer = await Customer.findById(req.body.customerId);
  if (!customer) return res.status(400).send("Invalid customer.");

  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const product = await Product.findById(req.body.productId).session(session);
    if (!product) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).send("Invalid product.");
    }

    if (product.numberInStock === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).send("Product not in stock.");
    }

    let enrollment = new Enrollment({
      customer: {
        _id: customer._id,
        name: customer.name,
        phone: customer.phone,
      },
      product: {
        _id: product._id,
        name: product.name,
        description: product.description,
        numberInStock: product.numberInStock,
        productPrice: product.productPrice,
        startDate: product.startDate,
        endDate: product.endDate,
      },
      enrollmentFee: product.productPrice,
    });

    enrollment = await enrollment.save({ session });

    product.numberInStock--;
    await product.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.send(enrollment);
  } catch (ex) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    res.status(500).send("Enrollment Failed with undefined error.");
    throw ex;
  }
});

router.get("/:id", async (req, res) => {
  const enrollment = await Enrollment.findById(req.params.id);

  if (!enrollment)
    return res
      .status(404)
      .send("The enrollment with the given ID was not found.");

  res.send(enrollment);
});

module.exports = router;
