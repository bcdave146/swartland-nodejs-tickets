// STATE is the state of the call in a open or closed status
// New, In Progress, Waiting for Info, Resolved, Overdue

const Joi = require("joi");
const mongoose = require("mongoose");

const stateSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 25,
  },
  color: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 10,
  },
});

const State = mongoose.model("State", stateSchema);

// function validateState
function validateState(state) {
  const schema = {
    name: Joi.string().min(3).max(25).required(),
    color: Joi.string().min(3).max(10).required(),
  };

  return Joi.validate(state, schema);
}

module.exports.stateSchema = stateSchema;
module.exports.State = State;
module.exports.validateState = validateState;
