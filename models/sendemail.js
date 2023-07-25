const mongoose = require("mongoose");
const Joi = require("joi");
const boolean = require("joi/lib/types/boolean");

const sendEmailSchema = new mongoose.Schema({
  sendEmailNumber: {
    type: Number,
    required: true,
    unquiue: true,
  },
  toAddress: {
    type: String,
    required: true,
    minlength: 7,
    maxlength: 50,
  },
  fromAddress: {
    type: String,
    required: true,
    minlength: 7,
    maxlength: 50,
  },
  subject: {
    type: String,
    required: true,
    maxlength: 35,
  },
  emailBody: {
    type: String,
    maxlength: 500,
  },
  customerNumber: {
    type: Number,
    required: true,
  },
  customerName: {
    type: String,
    requied: true,
    maxlength: 50,
  },
  ticketNumber: {
    type: Number,
    required: true,
  },
  commentNumber: {
    type: Number,
  },
  userName: {
    type: String,
    required: true,
    maxlength: 50,
  },
  dateSent: {
    type: Date,
    required: true,
    validate: {
      validator: function (value) {
        return value.getFullYear() >= 2020;
      },
      message: "Date must not be before the year 2020",
    },
  },
  responseMessage: {
    type: String,
  },
  deliverySuccess: {
    type: Boolean,
  },
});

const SendEmail = mongoose.model("SendEmail", sendEmailSchema);

function validateSendEmail(sendEmail) {
  const schema = {
    toAddress: Joi.string().min(7).max(50).email().required(),
    fromAddress: Joi.string().min(7).max(50).email().required(),
    subject: Joi.string().max(35).required(),
    emailBody: Joi.string().max(500).required(),
    customerNumber: Joi.number().required(),
    customerName: Joi.string().min(5).max(50).required(),
    ticketNumber: Joi.number().required(),
    commentNumber: Joi.number().optional(),
    userName: Joi.string().min(2).max(50).required(),
    dateSent: Joi.date().required(),
    sentSuccess: Joi.boolean().default(false),
    responseMessage: Joi.string(),
    deliverySuccess: Joi.boolean(),
  };

  return Joi.validate(sendEmail, schema);
}

module.exports.sendEmailSchema = sendEmailSchema;
module.exports.SendEmail = SendEmail;
module.exports.validateSendEmail = validateSendEmail;
