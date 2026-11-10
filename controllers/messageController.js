import Message from "../models/message.js";
import { sendContactEmail } from "../services/emailService.js";

export const createMessage = async (
  req,
  res
) => {

  try {

    const {
      name,
      email,
      subject,
      message,
    } = req.body;


    if (
      !name ||
      !email ||
      !subject ||
      !message
    ) {

      return res.status(400).json({
        message: "All fields are required",
      });

    }


    const newMessage =
      await Message.create({
        name,
        email,
        subject,
        message,
      });

    // Send email to admin (non-blocking)
    try {
      await sendContactEmail(
        name,
        email,
        subject,
        message
      );
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      message:
        "Message sent successfully",
      data: newMessage,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }

};


export const getMessages = async (
  req,
  res
) => {

  try {

    const messages = await Message
      .find()
      .sort({ createdAt: -1 });

    res.json(messages);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }

};


export const deleteMessage = async (
  req,
  res
) => {

  try {

    await Message.findByIdAndDelete(
      req.params.id
    );

    res.json({
      message: "Message deleted",
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }

};


export const markAsRead = async (
  req,
  res
) => {

  try {

    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    res.json(message);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }

};