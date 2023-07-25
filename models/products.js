const mongoose = require("mongoose");

const { instructorSchema } = require("./instructors");
const Joi = require("joi");

// Create schema

const Product = mongoose.model(
  "Products",
  new mongoose.Schema({
    productCode: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 25,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 255,
    },
    description: {
      type: String,
      required: true,
      minlenght: 15,
      maxlength: 3000,
    },
    instructor: {
      type: instructorSchema,
      ref: "Instructor",
      required: true,
    },
    numberInStock: {
      type: Number,
      required: true,
      min: 0,
      max: 9999,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    productPrice: {
      type: mongoose.Decimal128,
      required: true,
      min: 0,
      max: 9999999,
    },
    active: {
      type: Boolean,
      default: true,
    },
  })
);

// function validateProducts
function validateProduct(product) {
  const schema = {
    productCode: Joi.string().min(5).max(25).required(),
    name: Joi.string().min(5).max(50).required(),
    description: Joi.string().min(15).max(3000).required(),
    instructorId: Joi.objectId().required(),
    numberInStock: Joi.number().min(0).required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
    productPrice: Joi.number().min(0).required(),
    active: Joi.boolean(),
  };

  return Joi.validate(product, schema);
}

module.exports.Product = Product;
module.exports.validateProduct = validateProduct;
