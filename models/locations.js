const Joi = require("joi");
const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
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

const Location = mongoose.model("Location", locationSchema);

// function validateLocation
function validateLocation(location) {
  const schema = {
    name: Joi.string().min(5).max(25).required(),
    color: Joi.string().min(3).max(10).required(),
  };

  return Joi.validate(location, schema);
}

module.exports.locationSchema = locationSchema;
module.exports.Location = Location;
module.exports.validateLocation = validateLocation;
