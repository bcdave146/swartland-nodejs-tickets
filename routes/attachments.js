const express = require("express");
const multer = require("multer");
const _ = require("lodash");

const validateObjectId = require("../middleware/validateObjectId");
const asyncMiddleware = require("../middleware/async");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const Counter = require("../models/counter");

const { Attachment, validateAttachment } = require("../models/attachments");

const router = express.Router();

// Setup CORS parameters
const corsOptions = {
  origin: "*",
  methods: ["GET", "PUT", "POST", "DELETE"],
};

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({ storage });

/* This code defines a GET route for the "/attachments" endpoint. It uses the `auth` and `admin`
middleware functions to ensure that only authenticated and authorized users can access the route. It
then uses the `asyncMiddleware` function to handle any asynchronous errors that may occur during the
execution of the route handler. */

router.get(
  "/",
  [auth, admin],
  asyncMiddleware(async (req, res) => {
    const attachments = await Attachment.find().sort("name");
    const pickedAttachments = attachments.map((attachment) =>
      _.pick(attachment, [
        "_id",
        "attachmentNumber",
        "name",
        "contentType",
        "size",
        "uploadDate",
        "ticketId",
        "customerId",
        "userId",
      ])
    );

    res.send(pickedAttachments);
  })
);

// /api/attachment/1

router.get(
  "/:id",
  [auth],
  validateObjectId,
  asyncMiddleware(async (req, res) => {
    const attachment = await Attachment.findById(req.params.id);

    if (!attachment)
      return res
        .status(404)
        .send("The Attachment with the given ID was not found!");

    res.set({
      "Content-Type": attachment.contentType,
      "Content-Disposition": `attachment; filename="${attachment.originalname}"`,
    });

    res.send(attachment.fileData);
  })
);

router.get(
  "/ticket/:id",
  [auth],
  validateObjectId,
  asyncMiddleware(async (req, res) => {
    const ticketId = req.params.id;

    const attachments = await Attachment.find({ ticketId });

    if (attachments.length === 0)
      return res
        .status(404)
        .send("No attachments found for the given ticket ID");

    // res.set({
    //   "Content-Type": attachment.contentType,
    //   "Content-Disposition": `attachment; filename="${attachment.originalname}"`,
    // });
    const pickedAttachments = attachments.map((attachment) =>
      _.pick(attachment, [
        "_id",
        "attachmentNumber",
        "name",
        "size",
        "contentType",
        "uploadDate",
        "ticketId",
        "customerId",
        "userId",
      ])
    );
    res.send(pickedAttachments);
  })
);

// App POST - use auth middleware function to verify user

router.post(
  "/",
  [auth],
  upload.single("fileData"),
  asyncMiddleware(async (req, res) => {
    try {
      const { error } = validateAttachment(req.body);
      if (error) return res.status(400).send(error.details[0].message);

      const counter = await Counter.findByIdAndUpdate(
        { _id: "attachmentNumber" },
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
      );

      const attachmentNumber = counter.sequence_value
        .toString()
        .padStart(7, "0");

      // Validate the ticket number to be within the desired range
      if (parseInt(attachmentNumber) >= 10000000) {
        return res
          .status(400)
          .send("Attachment number exceeds the maximum allowed limit.");
      }

      const attachment = new Attachment({
        attachmentNumber,
        name: req.body.name,
        originalname: req.body.originalname,
        contentType: req.body.contentType,
        size: req.body.size,
        ticketId: req.body.ticketId,
        customerId: req.body.customerId,
        userId: req.body.userId,
        uploadDate: new Date(),
        fileData: req.file.buffer,
      });
      const savedAttachment = await attachment.save();
      res.send(
        _.pick(savedAttachment, [
          "_id",
          "attachmentNumber",
          "name",
          "size",
          "uploadDate",
          "ticketId",
          "customerId",
          "userId",
        ])
      );
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).send("Duplicate record");
      }
      console.error(error);
      res.status(500).send("An unexpected error occurred." + error);
    }
  })
);

// App PUT

router.put(
  "/:id",
  [auth, admin],
  upload.single("fileData"),
  async (req, res) => {
    const { error } = validateAttachment(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const attachment = await Attachment.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        originalname: req.body.originalname,
        contentType: req.body.contentType,
        size: req.body.size,
        uploadDate: new Date(),
        ticketId: req.body.ticketId,
        customerId: req.body.customerId,
        userId: req.body.userId,
        fileData: req.file ? req.file.buffer : undefined,
      },
      {
        new: true,
      }
    );

    if (!attachment)
      return res
        .status(404)
        .send("The attachment with the given ID was not found!");

    res.send(
      _.pick(attachment, [
        "_id",
        "attachmentNumber",
        "name",
        "size",
        "uploadDate",
        "ticketId",
        "customerId",
        "userId",
      ])
    );
  }
);

// App HTTP DELETE
// parameters path, middleware, req, res, next
router.delete("/:id", [auth, admin], async (req, res) => {
  // Look up the attachment
  // Not existing, return 404
  const attachment = await Attachment.findByIdAndRemove(req.params.id);
  if (!attachment)
    return res
      .status(404)
      .send("The attachment with the given ID was not found!"); // 404

  // Return the same attachment

  res.send(
    _.pick(attachment, [
      "_id",
      "attachmentNumber",
      "name",
      "size",
      "uploadDate",
      "ticketId",
      "customerId",
      "userId",
    ])
  );
});

module.exports = router;
