const express = require("express");
const cors = require("cors");

// TO DELETE const instructors = require("../routes/instructors");
const categories = require("../routes/categories");
const states = require("../routes/states");
const assignees = require("../routes/assignees");
const customers = require("../routes/customers");
const attachments = require("../routes/attachments");
const tickets = require("../routes/tickets");
const comments = require("../routes/comments");
const sendEmail = require("../routes/sendemail");
const users = require("../routes/users");
const auth = require("../routes/auth");
const error = require("../middleware/error");

// Setup CORS parameters
const corsOptions = {
  origin: "*",
  methods: ["GET", "PUT", "POST", "DELETE"],
};

const corsOptionsPayments = {
  origin: ["/.payfast/.co/.za$"],
  methods: ["GET", "PUT", "POST"],
};

module.exports = function (app) {
  app.use(cors(corsOptions), express.json()); // req.body object populated from the request to handle JSON type HTTP calls
  app.use("/api/states/", cors(corsOptions), states);
  app.use("/api/categories/", cors(corsOptions), categories);
  app.use("/api/assignees/", cors(corsOptions), assignees);
  app.use("/api/attachments/", cors(corsOptions), attachments);
  app.use("/api/tickets/", cors(corsOptions), tickets);
  app.use("/api/comments/", cors(corsOptions), comments);
  app.use("/api/sendemail/", cors(corsOptions), sendEmail);
  app.use("/api/customers/", cors(corsOptions), customers); // This tells express to route to customers module

  app.use("/api/users/", cors(corsOptions), users); // This tells express to route to users module
  app.use("/api/auth/", cors(corsOptions), auth); // This tells express to route to auth module

  app.use(error); // This handles all Errors, Error handling function in Express ONLY
};
