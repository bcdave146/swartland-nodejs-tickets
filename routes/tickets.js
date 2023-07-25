const express = require("express");
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const {
  Ticket,
  validateTicket,
  startStopwatch,
  pauseStopwatch,
  stopStopwatch,
} = require("../models/tickets");
const { Customer, validateCustomer } = require("../models/customers");
const { Category, validateCategory } = require("../models/categories");
const { Assignee, validateAssignee } = require("../models/assignees");
const { Attachment, validateAttachment } = require("../models/attachments");
const { Comment, validateComment } = require("../models/comments");
const { State, validState } = require("../models/states");
const Counter = require("../models/counter");

// customer, category, assignee, attachment, comments

const router = express.Router();

// Routes

// Get all tickets
router.get("/", async (req, res) => {
  const tickets = await Ticket.find().sort("name");
  res.send(tickets);
});

// Get a ticket by ticketNo

// Get a ticket by ticketId or ticketNo
router.get("/:id", async (req, res) => {
  let ticket;

  if (mongoose.Types.ObjectId.isValid(req.params.id)) {
    ticket = await Ticket.findById(req.params.id);
  } else if (
    !isNaN(parseInt(req.params.id)) &&
    req.params.id >= 1 &&
    req.params.id <= 10000000
  ) {
    ticket = await Ticket.findOne({ ticketNumber: req.params.id });
  }

  if (!ticket)
    return res.status(404).send("The request with the given ID was not found!"); // 404

  res.send(ticket);
});

// App POST

router.post("/", auth, async (req, res) => {
  const { error } = validateTicket(req.body);
  if (error) return res.status(400).send(error.details[0].message); // 400 Bad Request

  // Get data for write
  // customer
  const customer = await Customer.findById(req.body.customerId);
  if (!customer) return res.status(400).send("Customer not found.");

  // category
  const category = await Category.findById(req.body.categoryId);
  if (!category) return res.status(400).send("Category not found.");

  // Check if assigneeId is present in req.body
  // assignee

  const assignee = await Assignee.findById(req.body.assigneeId);
  if (!assignee) return res.status(400).send("Assignee not found.");

  // state
  const state = await State.findById(req.body.stateId);
  if (!state) return res.status(400).send("State not found.");

  // Check the id's exist for comments and attachments before writing
  // Validate attachments
  const attachmentIds = req.body.attachment;
  if (attachmentIds.length > 0) {
    const validAttachments = await Attachment.find({
      _id: { $in: attachmentIds },
    }).lean();
    if (validAttachments.length !== attachmentIds.length) {
      return res.status(400).send("Invalid attachment IDs");
    }
  }
  // Validate comments
  const commentIds = req.body.comments;
  if (commentIds.length > 0) {
    const validComments = await Comment.find({
      _id: { $in: commentIds },
    }).lean();
    if (validComments.length !== commentIds.length) {
      return res.status(400).send("Invalid Comment IDs");
    }
  }

  try {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "ticketNumber" },
      { $inc: { sequence_value: 1 } },
      { new: true, upsert: true }
    );

    const ticketNumber = counter.sequence_value.toString().padStart(6, "0");

    // Validate the ticket number to be within the desired range
    if (parseInt(ticketNumber) >= 1000000) {
      return res
        .status(400)
        .send("Ticket number exceeds the maximum allowed limit.");
    }

    // console.log("here in tickets.js - ", ticketNumber, customer);

    const ticket = new Ticket({
      ticketNumber,
      name: req.body.name,
      description: req.body.description,
      customer: {
        _id: customer._id,
        customerNumber: customer.customerNumber,
        name: customer.name,
        contact: customer.contact,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        categories: customer.categories,
      },
      category: {
        _id: category._id,
        name: category.name,
        color: category.color,
      },

      assignee: {
        _id: assignee._id,
        name: assignee.name,
        email: assignee.email,
        phone: assignee.phone,
      },

      ticketType: req.body.ticketType,
      attachment: attachmentIds,
      userId: req.body.userId,
      priority: req.body.priority,
      state: {
        _id: state._id,
        name: state.name,
        color: state.color,
      },
      status: req.body.status,
      dateDue: req.body.dateDue,
      dateOpened: req.body.dateOpened,
      dateLastUpdate: Date.now(),
      clickupTaskId: req.body.clickupTaskId,
      githubIssueId: req.body.githubIssueId,
      comments: commentIds,
      resolution: req.body.resolution,
      categoryReference: req.body.categoryReference,
    });

    await ticket.save();

    res.send({ ticketNumber });
  } catch (error) {
    res.status(400).send("Error saving the ticket with : " + error);
  }
});

// App PUT

router.put("/:id", auth, async (req, res) => {
  // Validate
  // If invalid, return 400 - Bad request
  const { error } = validateTicket(req.body);
  if (error) return res.status(400).send(error.details[0].message); // 400 Bad Request

  // Get data for write
  // customer
  const customer = await Customer.findById(req.body.customerId);
  if (!customer) return res.status(400).send("Invalid customer request.");
  // category
  const category = await Category.findById(req.body.categoryId);
  if (!category) return res.status(400).send("Invalid category request.");

  // assignee
  const assignee = await Assignee.findById(req.body.assigneeId);
  if (!assignee) return res.status(400).send("Assignee not found.");

  // state
  const state = await State.findById(req.body.stateId);
  if (!state) return res.status(400).send("Invalid state request.");

  // Check the id's exist for comments and attachments before writing
  // Validate attachments
  const attachmentIds = req.body.attachment;
  if (attachmentIds.length > 0) {
    const validAttachments = await Attachment.find({
      _id: { $in: attachmentIds },
    }).lean();
    if (validAttachments.length !== attachmentIds.length) {
      return res.status(400).send("Invalid attachment IDs");
    }
  }
  // Validate Comment Ids

  const commentIds = req.body.comments;
  if (commentIds.length > 0) {
    const validComments = await Comment.find({
      _id: { $in: commentIds },
    }).lean();
    if (validComments.length !== commentIds.length) {
      return res.status(400).send("Invalid Comment IDs");
    }
  }

  // Create ticket
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res
        .status(404)
        .send("The ticket with the given ID was not found!");
    }

    // Update the ticket fields
    ticket.name = req.body.name;
    ticket.description = req.body.description;
    ticket.customer = {
      _id: customer._id,
      customerNumber: customer.customerNumber,
      name: customer.name,
      contact: customer.contact,
      email: customer.email,
      address: customer.address,
      phone: customer.phone,
    };
    ticket.category = {
      _id: category._id,
      name: category.name,
      color: category.color,
    };

    ticket.assignee = {
      _id: assignee._id,
      name: assignee.name,
      email: assignee.email,
      phone: assignee.phone,
    };

    ticket.ticketType = req.body.ticketType;
    ticket.attachment = attachmentIds;
    ticket.userId = req.body.userId;
    ticket.priority = req.body.priority;
    ticket.state = {
      _id: state._id,
      name: state.name,
      color: state.color,
    };
    ticket.status = req.body.status;
    ticket.dateOpened = ticket.dateOpened;
    ticket.dateLastUpdate = req.body.dateLastUpdate;
    ticket.dateClosed = req.body.dateClosed;
    ticket.dateResolved = req.body.dateResolved;
    ticket.dateDue = req.body.dateDue;
    ticket.clickupTaskId = req.body.clickupTaskId;
    ticket.githubIssueId = req.body.githubIssueId;
    ticket.comments = commentIds;
    ticket.resolution = req.body.resolution;
    ticket.categoryReference = req.body.categoryReference;

    /// Start, pause, or stop the stopwatch
    if (req.body.startStopwatch) {
      startStopwatch(ticket);
    } else if (req.body.pauseStopwatch) {
      pauseStopwatch(ticket);
    } else if (req.body.stopStopwatch) {
      stopStopwatch(ticket);
    }
    ticket.dateLastUpdate = Date.now();
    // Save the updated ticket
    const updatedTicket = await ticket.save();

    res.send(updatedTicket);
  } catch (error) {
    console.log("Error updating the ticket:", error);
    return res
      .status(500)
      .send("Error updating the ticket with the given ID." + error);
  }
});

module.exports = router;
