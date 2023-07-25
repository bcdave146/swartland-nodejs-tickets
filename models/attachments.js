const Joi = require("joi");
const mongoose = require("mongoose");

// Validate Id's
const { Ticket, validateTicket } = require("../models/tickets");
const { Customer, validateCustomer } = require("../models/customers");
// const { Assignee, validateAssignee } = require("../models/assignees");
const { User, vaidateUser } = require("../models/user");

const attachmentSchema = new mongoose.Schema({
  attachmentNumber: {
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50,
  },
  originalname: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50,
  },
  contentType: {
    type: String,
  },
  size: {
    type: Number,
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
  fileData: {
    type: Buffer,
    required: true,
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
});

const Attachment = mongoose.model("Attachment", attachmentSchema);

function validateAttachment(attachment) {
  const schema = {
    attachmentNumber: Joi.number().min(1),
    name: Joi.string().min(3).max(50).required(),
    originalname: Joi.string().min(3).max(50).required(),
    contentType: Joi.string()
      .valid(
        "application/pdf",
        "image/jpeg",
        "image/png",
        "text/csv",
        "text/txt",
        "application/vnd.ms-excel",
        "application/msword"
      )
      .required(),
    size: Joi.number().required(),
    uploadDate: Joi.date().required(),
    ticketId: Joi.objectId().required(),
    customerId: Joi.objectId().required(),
    userId: Joi.objectId().required(),
    fileData: Joi.binary(),
  };

  return Joi.validate(attachment, schema);
}

module.exports.attachmentSchema = attachmentSchema;
module.exports.Attachment = Attachment;
module.exports.validateAttachment = validateAttachment;
