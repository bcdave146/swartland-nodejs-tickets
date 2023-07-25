const jwt = require("jsonwebtoken");
const config = require("config");
const Joi = require("joi");
const mongoose = require("mongoose");

const { Assignee, assigneeSchema } = require("./assignees");
const { Customer } = require("./customers");

// User document

const userSchema = new mongoose.Schema({
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
    maxlength: 255,
  },
  password: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 1024,
  },
  isAdmin: { type: Boolean },
  isCustomer: { type: Boolean },
  isAssignee: { type: Boolean },
  isOperator: { type: Boolean },
  // Linked to
  linkCustomerId: {
    type: mongoose.ObjectId,
    validate: {
      validator: async function (value) {
        if (!value) return true; // Allow empty or not sent
        const customer = await Customer.findById(value);
        return customer ? true : false;
      },
      message: "Invalid customer request.",
    },
  },
  linkAssigneeId: {
    type: mongoose.ObjectId,
    validate: {
      validator: async function (value) {
        if (!value) return true; // Allow empty or not sent
        const assignee = await Assignee.findById(value);
        return assignee ? true : false;
      },
      message: "Invalid assignee request.",
    },
  },

  // roles: [],
  // operations: []
});

// Information Expert Principle
// NB CAN NOT USE () => function as 'this' can not be used need to define a function() to call
// Can add a method to object to be used when calling to generate a auth Token to use in header field x-auth-token
userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    {
      _id: this._id,
      name: this.name,
      email: this.email,
      isAdmin: this.isAdmin,
      isCustomer: this.isCustomer,
      isAssignee: this.isAssignee,
      isOperator: this.isOperator,
      linkCustomerId: this.linkCustomerId,
      linkAssigneeId: this.linkAssigneeId,
    },
    config.get("jwtPrivateKey")
  );
  return token;
};

const User = mongoose.model("User", userSchema);

function validateUser(user) {
  const schema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(255).required(),
    linkCustomerId: Joi.alternatives()
      .try(Joi.objectId(), Joi.string().allow("").empty(null))
      .optional(),
    linkAssigneeId: Joi.alternatives()
      .try(Joi.objectId(), Joi.string().allow("").empty(null))
      .optional(),
    isAdmin: Joi.boolean().optional(),
    isCustomer: Joi.boolean().optional(),
    isAssignee: Joi.boolean().optional(),
    isOperator: Joi.boolean().optional(),
  })
    .and("isAdmin", "isCustomer", "isAssignee", "isOperator")
    .when(
      Joi.object({
        isAdmin: Joi.boolean().valid(true),
      }).unknown(),
      {
        then: Joi.object({
          isCustomer: Joi.boolean().valid(false),
          isAssignee: Joi.boolean().valid(false),
          isOperator: Joi.boolean().valid(false),
        }),
      }
    )
    .when(
      Joi.object({
        isCustomer: Joi.boolean().valid(true),
      }).unknown(),
      {
        then: Joi.object({
          isAdmin: Joi.boolean().valid(false),
          isAssignee: Joi.boolean().valid(false),
          isOperator: Joi.boolean().valid(false),
        }),
      }
    )
    .when(
      Joi.object({
        isAssignee: Joi.boolean().valid(true),
      }).unknown(),
      {
        then: Joi.object({
          isAdmin: Joi.boolean().valid(false),
          isCustomer: Joi.boolean().valid(false),
          isOperator: Joi.boolean().valid(false),
        }),
      }
    )
    .when(
      Joi.object({
        isOperator: Joi.boolean().valid(true),
      }).unknown(),
      {
        then: Joi.object({
          isAdmin: Joi.boolean().valid(false),
          isCustomer: Joi.boolean().valid(false),
          isAssignee: Joi.boolean().valid(false),
        }),
      }
    );

  return schema.validate(user);
}

module.exports.userSchema = userSchema;
module.exports.User = User;
module.exports.validateUser = validateUser;
