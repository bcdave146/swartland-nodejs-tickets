const Joi = require("joi");
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 25,
  },
  color: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 10,
  },
});

const Category = mongoose.model("Category", categorySchema);

// function validateCategory
function validateCategory(category) {
  const schema = {
    name: Joi.string().min(5).max(25).required(),
    color: Joi.string().min(3).max(10).required(),
  };

  return Joi.validate(category, schema);
}

module.exports.categorySchema = categorySchema;
module.exports.Category = Category;
module.exports.validateCategory = validateCategory;
