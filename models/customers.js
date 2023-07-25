const mongoose = require("mongoose");
const Joi = require("joi");

const { Category, categorySchema } = require("./categories");

const customerSchema = new mongoose.Schema({
  customerNumber: {
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 50,
  },
  contact: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    minlength: 7,
    maxlength: 50,
  },
  phone: {
    type: String,
    required: true,
    minlength: 7,
    maxlength: 16,
  },
  address: {
    type: String,
    required: true,
    maxlength: 255,
  },
  comments: {
    type: String,
    maxlength: 2000,
  },
  active: {
    type: Boolean,
    default: true,
  },
  clickUpActive: {
    type: Boolean,
    default: false,
  },
  gitHubActive: {
    type: Boolean,
    default: false,
  },
  categories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
  ],
});

const Customer = mongoose.model("Customer", customerSchema);

function validateCustomers(customer) {
  const schema = {
    customerNumber: Joi.number().min(1),
    name: Joi.string().min(5).max(50).required(),
    contact: Joi.string().min(3).max(50).required(),
    email: Joi.string().min(7).max(50).email().required(),
    phone: Joi.string().min(7).required(),
    address: Joi.string().min(5).max(255).required(),
    comments: Joi.string().max(2000),
    active: Joi.boolean(),
    clickUpActive: Joi.boolean(),
    gitHubActive: Joi.boolean(),
    categories: Joi.array().items(Joi.objectId()).required(), // categoryId
  };

  return Joi.validate(customer, schema);
}

module.exports.customerSchema = customerSchema;
module.exports.Customer = Customer;
module.exports.validateCustomers = validateCustomers;
