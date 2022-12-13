require("dotenv").config();
const express = require("express");
const app = express();
const { createServer } = require("http");
const { Server } = require("socket.io");
const initialMongoConnection = require("./database/initialConnection");

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
  },
});

initialMongoConnection();

const login = require("./socket.io/handlers/loginHandler");
// { userId, socket }
const sockets = [];

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("login", (data) => {
    login(data, socket);
  });
});

const port = process.env.PORT || 9000;

httpServer.listen(port, () => console.log(`http://localhost:${port}`));

const User = require("./models/user.model");
const Conversation = require("./models/conversation.model");
const Message = require("./models/message.model");

async function emitReceivedDataFromDb(user, socket) {
  try {
    const users = await User.find({});
    sockets.push({ userId: user._id, socket });

    const conversations = await Conversation.find({ userIds: user._id });
    const conversationId = conversations.map((c) => c._id);
    if (conversations.length == 0) {
      socket.emit("receive-data-from-db", {
        conversations: null,
        messages: null,
        userlist: users,
        user,
      });
    } else {
      const messages = await Message.find({
        conversationId: { $in: conversationId },
      });
      socket.emit("receive-data-from-db", {
        conversations,
        user,
        userlist: users,
        messages,
      });
    }
  } catch (error) {
    console.log(error);
  }
}

module.exports = emitReceivedDataFromDb;
