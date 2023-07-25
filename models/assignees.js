const Joi = require("joi");
const mongoose = require("mongoose");

const assigneeSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 50,
  },

  phone: {
    type: String,
    required: true,
    minlength: 7,
    maxlength: 16,
  },
  active: {
    type: Boolean,
    default: true,
  },
});

const Assignee = mongoose.model("Assignee", assigneeSchema);

// function validateAssignee
function validateAssignee(assignee) {
  const schema = {
    name: Joi.string().min(5).max(50).required(),
    email: Joi.string().min(5).max(50).required().email(),
    phone: Joi.string().min(7).required(),
    active: Joi.boolean(),
  };

  return Joi.validate(assignee, schema);
}

module.exports.assigneeSchema = assigneeSchema;
module.exports.Assignee = Assignee;
module.exports.validateAssignee = validateAssignee;
