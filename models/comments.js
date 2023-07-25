const Joi = require("joi");
const mongoose = require("mongoose");

// Validate Id's
const { Ticket, validateTicket } = require("../models/tickets");
const { Customer, validateCustomer } = require("../models/customers");
const { Assignee, validateAssignee } = require("../models/assignees");
const { User, vaidateUser } = require("../models/user");

const commentSchema = new mongoose.Schema({
  commentNumber: {
    type: Number,
    required: true,
    unique: true,
  },
  detail: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 3000,
  }, // Comments details
  originalDetail: {
    type: String,
    maxlength: 3000,
    validate: {
      validator: async function (value) {
        if (!value) return true; // Allow empty or not sent
      },
      message: "Invalid originalDetail request.",
    },
  }, // Original comments should there be an edit

  createDate: {
    required: true,
    type: Date,
    default: Date.now,
  },
  changeDate: {
    required: true,
    type: Date,
  },
  ticketId: {
    type: mongoose.ObjectId,
    required: true,
    validate: {
      validator: async function (value) {
        if (!value) return false;
        const ticket = await Ticket.findById(value);
        return ticket ? true : false;
      },
      message: "Ticket with ticketId not found",
    },
  },
  customerId: {
    type: mongoose.ObjectId,
    required: true,
    validate: {
      validator: async function (value) {
        if (!value) return false;
        const customer = await Customer.findById(value);
        return customer ? true : false;
      },
      message: "Customer with customerId not found",
    },
  },
  userId: {
    type: mongoose.ObjectId,
    required: true,
    validate: {
      validator: async function (value) {
        if (!value) return false;
        const user = await User.findById(value);
        return user ? true : false;
      },
      message: "User with userId not found",
    },
  },
  assigneeId: {
    type: mongoose.ObjectId,
    validate: {
      validator: async function (value) {
        if (!value) return true;
        const assignee = await Assignee.findById(value);
        return assignee ? true : false;
      },
      message: "Assignee with assigneeId not found",
    },
  },
});

const Comment = mongoose.model("Comment", commentSchema);

function validateComment(comment) {
  const schema = {
    commentNumber: Joi.number().min(1),
    detail: Joi.string().min(5).max(3000).required(),
    originalDetail: Joi.string().empty("").max(3000).optional(),
    createDate: Joi.date().required(),
    changeDate: Joi.date().required(),
    ticketId: Joi.objectId().required(),
    customerId: Joi.objectId().required(),
    userId: Joi.objectId().required(),
    assigneeId: Joi.alternatives()
      .try(Joi.objectId(), Joi.string().allow("").empty(null))
      .optional(),
  };

  return Joi.validate(comment, schema);
}

module.exports.commentSchema = commentSchema;
module.exports.Comment = Comment;
module.exports.validateComment = validateComment;
