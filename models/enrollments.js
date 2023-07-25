// fields
// customer
// product
// quainty enrolled
// enrollmentDate
// completionDate

const Joi = require("joi");
const mongoose = require("mongoose");
const moment = require("moment");

const enrollmentSchema = new mongoose.Schema({
  customer: {
    type: new mongoose.Schema({
      name: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 50,
      },

      phone: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 50,
      },
    }),
    required: true,
  },
  product: {
    type: new mongoose.Schema({
      name: {
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 255,
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
    }),
    required: true,
  },

  enrollmentDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  completionDate: {
    type: Date,
  },
  enrollmentFee: {
    type: mongoose.Decimal128,
    min: 0,
  },
  enrollmentPaid: {
    type: Boolean,
    required: true,
    default: false,
  },
});

// DA 6 03 2023 Add the enrollmentId for the lookup to fix bug where two enrollments with same customer & product can not be processed.
// DA 7 03 2023 Bug fix for the enrollmentId field changed from "._id" to _id
enrollmentSchema.statics.lookup = function (
  enrollmentId,
  customerId
  // productId
) {
  return this.findOne({
    _id: enrollmentId,
    "customer._id": customerId,
    // "product._id": productId,
  });
};

// DA 28 02 2023 Add check for enrollment for customers if yes dont detele the customer
//
enrollmentSchema.statics.enrollmentLookup = function (customerId) {
  return this.findOne({
    "customer._id": customerId,
  });
};

// DA 02 03 2023 Add check for enrollment for products if yes dont detele the Product
//
enrollmentSchema.statics.enrollmentLookupProduct = function (productId) {
  return this.findOne({
    "product._id": productId,
  });
};

enrollmentSchema.methods.completion = function () {
  this.completionDate = new Date();
  // TO DO Add any extra charges here on the completion of the enrollment if needed.
  const enrollmentDays = moment().diff(this.enrollmentDate, "days");
  // this.enrollmentFee = enrollmentDays * this.product.productPrice;
  if (!this.enrollmentFee) {
    this.enrollmentFee = this.product.productPrice;
  }
};

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);

function validateEnrollment(enrollment) {
  const schema = {
    customerId: Joi.objectId().required(),
    productId: Joi.objectId().required(),
  };

  return Joi.validate(enrollment, schema);
}

exports.Enrollment = Enrollment;
exports.validateEnrollment = validateEnrollment;
