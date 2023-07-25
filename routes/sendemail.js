const express = require("express");
// const { exec } = require("child_process");
const _ = require("lodash");

const validateObjectId = require("../middleware/validateObjectId");
const asyncMiddleware = require("../middleware/async");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const Counter = require("../models/counter");
const { SendEmail, validateSendEmail } = require("../models/sendemail");
const { deliverEmail } = require("../components/deliverEmail");

const router = express.Router();

// Get a email by id
router.get(
  "/:id",
  [auth],
  validateObjectId,
  asyncMiddleware(async (req, res) => {
    const sendemail = await SendEmail.findById(req.params.id);

    if (!sendemail)
      return res.status(404).send("The Email with the given ID was not found!"); // 404

    res.send(sendemail);
  })
);

router.get(
  "/ticket/:id",
  [auth],
  asyncMiddleware(async (req, res) => {
    const ticketNumber = req.params.id;

    const sendemails = await SendEmail.find({ ticketNumber });

    if (sendemails.length === 0)
      return res
        .status(404)
        .send("No emails found for the given ticket number!");

    res.send(sendemails);
  })
);

// POST endpoint to accept email and subject details
router.post(
  "/",
  [auth],
  asyncMiddleware(async (req, res) => {
    const { error } = validateSendEmail(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    // get next number from counter
    const counter = await Counter.findByIdAndUpdate(
      { _id: "sendEmailNumber" },
      { $inc: { sequence_value: 1 } },
      { new: true, upsert: true }
    );
    const sendEmailNumber = counter.sequence_value.toString().padStart(8, "0");
    // Validate the ticket number to be within the desired range
    if (parseInt(sendEmailNumber) >= 100000000) {
      return res
        .status(400)
        .send("Send Email number exceeds the maximum allowed limit.");
    }

    // Perform any necessary validation on the email and subject

    const sendEmail = new SendEmail({
      sendEmailNumber,
      toAddress: req.body.toAddress,
      fromAddress: req.body.fromAddress,
      subject: req.body.subject,
      emailBody: req.body.emailBody,
      customerNumber: req.body.customerNumber,
      customerName: req.body.customerName,
      ticketNumber: req.body.ticketNumber,
      commentNumber: req.body.commentNumber,
      userName: req.body.userName,
      dateSent: req.body.dateSent,
      deliverySuccess: false,
      responseMessage: "To send",
    });

    const content = `
      Customer Name: ${sendEmail.customerName}
      Ticket Number: ${sendEmail.ticketNumber}
      Logged by: ${sendEmail.userName}
      Date : ${sendEmail.dateSent}

      ${sendEmail.emailBody}
      `;

    try {
      const response = await deliverEmail(
        sendEmail.toAddress,
        sendEmail.fromAddress,
        sendEmail.subject,
        content
      );
      // console.log(
      //   "here in sendmail.js - deliverEmail",
      //   response.deliverySuccess,
      //   response.info.response
      // );

      sendEmail.deliverySuccess = response.deliverySuccess;
      sendEmail.responseMessage = response.info.response;
    } catch (error) {
      sendEmail.deliverySuccess = error.deliverySuccess;
      sendEmail.responseMessage = error.error.response;
      // console.log(
      //   "This is the error",
      //   error,
      //   error.error,
      //   error.deliverySuccess
      // );
    }

    //console.log("here in sendemail.js", sendEmail);
    await sendEmail.save();
    res.send({
      sendEmailNumber,
      deliverySuccess: sendEmail.deliverySuccess,
      responseMessage: sendEmail.responseMessage,
    });

    //   const emailBody = sendEmail.emailBody;
    //   const subject = sendEmail.subject;
    //   const toAddress = sendEmail.toAddress;
    //   const fromAddress = sendEmail.fromAddress;
    //   // Command to execute the Linux bash script
    //   const bashScript = `echo "${content}" | /usr/bin/mail -s "${sendEmail.subject}" -r ${sendEmail.fromAddress} ${sendEmail.toAddress}`;
    //   //  Execute the bash script
    //   exec(bashScript, async (error, stdout, stderr) => {
    //     if (error || stderr) {
    //       console.error(
    //         "Error occurred while executing the bash script:",
    //         stderr
    //       );
    //       res.status(500).send("An unexpected error occurred :" + stderr);
    //       return;
    //     } else {
    //       console.log("here in sendmail.js bashScript ", bashScript);
    //       await sendEmail.save();
    //       res.send({ sendEmailNumber });
    //     }
    //   });

    //   try {
    // } catch (error) {
    //   console.error("Error updating the ticket:");
    //   return res
    //     .status(500)
    //     .send("Error updating the ticket with the given ID." + error);
    // }
  })
);

module.exports = router;
