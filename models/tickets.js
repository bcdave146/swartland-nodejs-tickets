const mongoose = require("mongoose");

const Counter = require("./counter");
const { customerSchema } = require("./customers");
const { stateSchema } = require("./states");
const { categorySchema } = require("./categories");
const { Assignee, assigneeSchema } = require("./assignees");
const { attachmentSchema } = require("./attachments");

const Joi = require("joi");

// Validations
const priorityEnum = ["Critical", "High", "Normal", "Low"]; // TODO change this to be stored in document priority
const statusEnum = ["Open", "On Hold", "Resolved", "Closed"]; // TODO change this to be stored in document status
const ticketTypeEnum = [
  "4G Modem",
  "Aastra",
  "Acrobat",
  "Adsl",
  "Antivirus",
  "Autocad",
  "Bartender",
  "Barcode Printer",
  "Bug",
  "Cabeling",
  "Cellphone",
  "CPAR",
  "CurroQuip",
  "Desktop",
  "Diginet",
  "Enhancement",
  "Euphoria",
  "Espresso",
  "Excel",
  "Extention",
  "Fiber",
  "Freshdesk",
  "Handset",
  "Keyboard",
  "Laptop",
  "LTE",
  "Mouse",
  "Outlook",
  "Powerpoint",
  "Printer",
  "Project",
  "Qdoc's",
  "Qlikview",
  "Quote",
  "RDP",
  "Router",
  "Scanner",
  "Server",
  "Shortdail",
  "Solidworks",
  "Stockapp",
  "Support",
  "Switch",
  "Terminal",
  "VPN",
  "V6/Estimating Program",
  "Wifi AP",
  "Winrar",
  "Windows Updates",
  "Word",
]; // TODO change this to be stored in document

// Create schema
const ticketSchema = new mongoose.Schema({
  ticketNumber: {
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 50,
  },
  description: {
    type: String,
    required: true,
    minlenght: 15,
    maxlength: 3000,
  },
  customer: {
    type: customerSchema,
    ref: "Customer",
    required: true,
  },
  ticketType: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 15,
    enum: {
      values: ticketTypeEnum,
      message:
        "Invalid ticket type, should be either: " + ticketTypeEnum.join(", "),
    },
  },
  category: {
    type: categorySchema,
    ref: "Category",
    required: true,
  },
  assignee: {
    type: assigneeSchema,
    ref: "Assignee",

    validate: {
      validator: async function (value) {
        if (!value) return true; // Allow empty or not sent
        const assignee = await Assignee.findById(value);
        return assignee ? true : false;
      },
      message: "Invalid assignee request.",
    },
  },
  attachment: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attachments",
    },
  ],
  userId: {
    type: mongoose.ObjectId,
    requirted: true,
  },
  priority: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 10,
    enum: {
      values: priorityEnum,
      message:
        "Invalid ticket priority, should be either: " + priorityEnum.join(", "),
    },
  },
  state: {
    type: stateSchema,
    ref: "State",
    required: true,
  },
  status: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 10,
    enum: {
      values: statusEnum,
      message:
        "Invalid ticket status, should be either: " + statusEnum.join(", "),
    },
    validate: {
      validator: function (value) {
        if (
          value === "Closed" &&
          (!this.dateResolved ||
            !this.dateClosed ||
            this.dateClosed < this.dateResolved)
        ) {
          return false;
        }
        return true;
      },
      message:
        "If status is 'Closed', both dateResolved and dateClosed are required with dateClosed being after dateResolved.",
    },
  },
  dateOpened: {
    type: Date,
    required: true,
    default: Date.now,
  },
  dateAssigned: {
    type: Date,
  },
  dateLastUpdate: {
    type: Date,
    default: Date.now,
  },
  dateDue: {
    type: Date,
  },
  dateResolved: {
    type: Date,
    validate: {
      validator: function (value) {
        if (this.dateClosed && value > this.dateClosed) {
          return false;
        }
        return true;
      },
      message: "dateResolved must be equal to or before dateClosed.",
    },
  },
  dateClosed: {
    type: Date,
    validate: {
      validator: function (value) {
        if (this.dateResolved && value < this.dateResolved) {
          return false;
        }
        return true;
      },
      message: "dateClosed must be equal to or after dateResolved.",
    },
  },
  clickupTaskId: {
    type: String,
    minlength: 1,
    maxlength: 30,
    default: "0",
  },
  githubIssueId: {
    type: String,
    minlength: 1,
    maxlength: 30,
    default: "0",
  },
  stopwatch: {
    type: Number,
    default: 0,
  },
  startTime: {
    type: Date,
  },
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comments",
    },
  ],
  resolution: {
    type: String,
    minlength: 10,
    maxlength: 2000,
    validate: {
      validator: function (value) {
        if (value && !this.dateResolved) {
          return false;
        }
        return true;
      },
      message: "If resolution is provided, dateResolved is required.",
    },
  },
  categoryReference: {
    type: String,
    maxlength: 50,
  },
});

const Ticket = mongoose.model("Tickets", ticketSchema);
// Start the stopwatch for a task
async function startStopwatch(ticket) {
  if (ticket) {
    // Check if the stopwatch is already running
    if (ticket.stopwatch === 0) {
      // Start the stopwatch by setting the current timestamp as the start time
      ticket.startTime = Date.now();
      console.log("Stopwatch started for ticket:", ticket._id);
    } else {
      // Unpause the stopwatch and continue from where it was paused
      if (ticket.startTime === null && ticket.stopwatch > 0) {
        // Set the current timestamp as the start time to resume the stopwatch
        ticket.startTime = Date.now();
        console.log("Stopwatch resumed for ticket:", ticket._id);
      } else {
        console.log("Stopwatch is already running for ticket:", ticket._id);
      }
    }
  } else {
    console.log("Ticket not found:", ticket._id);
  }
}

// Pause the stopwatch for a task
async function pauseStopwatch(ticket) {
  if (ticket) {
    // Check if the stopwatch is currently running
    if (ticket.startTime !== null) {
      // Calculate the elapsed time in seconds and add it to the stopwatch
      const elapsedTime = Math.floor((Date.now() - ticket.startTime) / 1000); // Convert milliseconds to seconds
      ticket.stopwatch += elapsedTime;
      ticket.startTime = null;
      console.log("Stopwatch paused for ticket:", ticket._id);
    } else {
      console.log("Stopwatch is already paused for ticket:", ticket._id);
    }
  } else {
    console.log("Ticket not found:", ticket._id);
  }
}

// Stop the stopwatch for a task
async function stopStopwatch(ticket) {
  if (ticket) {
    // Check if the stopwatch is currently running
    if (ticket.startTime !== null) {
      // Calculate the elapsed time in seconds and add it to the stopwatch
      const elapsedTime = Math.floor((Date.now() - ticket.startTime) / 1000); // Convert milliseconds to seconds
      ticket.stopwatch += elapsedTime;
      ticket.startTime = null;
      console.log("Stopwatch stopped for ticket:", ticket._id);
    } else {
      console.log("Stopwatch is not running for ticket:", ticket._id);
    }
  } else {
    console.log("Ticket not found:", ticket._id);
  }
}

// function validateTicket
function validateTicket(ticket) {
  const schema = {
    ticketNumber: Joi.number().min(1),
    name: Joi.string().min(5).max(50).required(),
    description: Joi.string().min(15).max(3000).required(),
    customerId: Joi.objectId().required(),
    ticketType: Joi.string().min(3).max(15).required(),
    categoryId: Joi.objectId().required(),
    assigneeId: Joi.objectId().required(),
    attachment: Joi.array().items(Joi.objectId()), // attachmentId(s)
    userId: Joi.objectId().required(),
    priority: Joi.string().min(3).max(10).required(),
    stateId: Joi.objectId().required(),
    status: Joi.string().min(3).max(10).required(),
    dateOpened: Joi.date().required(),
    dateAssigned: Joi.date(),
    dateLastUpdate: Joi.date(),
    dateDue: Joi.date(),
    dateResolved: Joi.date(),
    dateClosed: Joi.date(),
    clickupTaskId: Joi.string().min(1).max(30),
    githubIssueId: Joi.string().min(1).max(30),
    startStopwatch: Joi.boolean().optional(),
    pauseStopwatch: Joi.boolean().optional(),
    stopStopwatch: Joi.boolean().optional(),
    comments: Joi.array().items(Joi.objectId()), // commentId(s)
    resolution: Joi.string().min(10).max(2000),
    categoryReference: Joi.string().max(50).optional().empty("").allow(null),
  };

  return Joi.validate(ticket, schema);
}

module.exports.customerSchema = customerSchema;
module.exports.Ticket = Ticket;
module.exports.validateTicket = validateTicket;
module.exports.startStopwatch = startStopwatch;
module.exports.pauseStopwatch = pauseStopwatch;
module.exports.stopStopwatch = stopStopwatch;
