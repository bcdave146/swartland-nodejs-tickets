const express = require("express");
const multer = require("multer");
const _ = require("lodash");

const validateObjectId = require("../middleware/validateObjectId");
const asyncMiddleware = require("../middleware/async");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const Counter = require("../models/counter");

const { Comment, validateComment } = require("../models/comments");

const router = express.Router();

// Setup CORS parameters
const corsOptions = {
  origin: "*",
  methods: ["GET", "PUT", "POST"],
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
  [auth],
  asyncMiddleware(async (req, res) => {
    const comments = await Comment.find().sort("name");
    const pickedComments = comments.map((comment) =>
      _.pick(comment, [
        "_id",
        "commentNumber",
        "detail",
        "createDate",
        "changeDate",
        "ticketId",
        "customerId",
        "userId",
        "assigneeId",
      ])
    );

    res.send(pickedComments);
  })
);

// /api/comment/1

router.get(
  "/:id",
  [auth],
  validateObjectId,
  asyncMiddleware(async (req, res) => {
    const comment = await Comment.findById(req.params.id);

    if (!comment)
      return res
        .status(404)
        .send("The Comment with the given ID was not found!"); // 404 moved to error.js

    res.send(comment);
  })
);

router.get(
  "/ticket/:id",
  [auth],
  validateObjectId,
  asyncMiddleware(async (req, res) => {
    const ticketId = req.params.id;

    const comments = await Comment.find({ ticketId });

    if (comments.length === 0)
      return res.status(404).send("No comments found for the given ticket ID!");

    res.send(comments);
  })
);

// App POST - use auth middleware function to verify user

router.post(
  "/",
  [auth],
  asyncMiddleware(async (req, res) => {
    try {
      const { error } = validateComment(req.body);
      if (error) return res.status(400).send(error.details[0].message);

      const counter = await Counter.findByIdAndUpdate(
        { _id: "commentNumber" },
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
      );

      const commentNumber = counter.sequence_value.toString().padStart(7, "0");

      // Validate the ticket number to be within the desired range
      if (parseInt(commentNumber) >= 10000000) {
        return res
          .status(400)
          .send("Comment number exceeds the maximum allowed limit.");
      }

      const comment = new Comment({
        commentNumber,
        detail: req.body.detail,
        originalDetail: req.body.originalDetail,
        createDate: req.body.createDate,
        changeDate: req.body.changeDate,
        ticketId: req.body.ticketId,
        customerId: req.body.customerId,
        userId: req.body.userId,
        assigneeId: req.body.assigneeId,
      });
      const savedComment = await comment.save();
      res.send(
        _.pick(savedComment, [
          "_id",
          "commentNumber",
          "detail",
          "createDate",
          "changeDate",
          "ticketId",
          "customerId",
          "userId",
          "assigneeId",
        ])
      );
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).send("Duplicate record");
      }
      console.error(error);
      res.status(500).send("An unexpected error occurred : " + error);
    }
  })
);

// App PUT

router.put("/:id", [auth], async (req, res) => {
  const { error } = validateComment(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const comment = await Comment.findByIdAndUpdate(
    req.params.id,
    {
      detail: req.body.detail,
      originalDetail: req.body.originalDetail,
      createDate: req.body.createDate,
      changeDate: req.body.changeDate,
      ticketId: req.body.ticketId,
      customerId: req.body.customerId,
      userId: req.body.userId,
      assigneeId: req.body.assigneeId,
    },
    {
      new: true,
    }
  );

  if (!comment)
    return res.status(404).send("The comment with the given ID was not found!");

  res.send(
    _.pick(comment, [
      "_id",
      "commentNumber",
      "detail",
      "originalDetail",
      "createDate",
      "changeDate",
      "ticketId",
      "customerId",
      "userId",
      "assigneeId",
    ])
  );
});

// App HTTP DELETE
// parameters path, middleware, req, res, next
router.delete("/:id", [auth, admin], async (req, res) => {
  // Look up the attachment
  // Not existing, return 404
  const comment = await Comment.findByIdAndRemove(req.params.id);
  if (!comment)
    return res.status(404).send("The comment with the given ID was not found!"); // 404

  // Return the same attachment

  res.send(
    _.pick(attachment, [
      "_id",
      "commentNumber",
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
