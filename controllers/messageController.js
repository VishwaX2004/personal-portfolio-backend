import Message from "../models/message.js";


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