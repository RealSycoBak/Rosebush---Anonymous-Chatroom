const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");
const sanitizeHtml = require("sanitize-html");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

var UserOnline = 0;
/* var userColors = {}; */
var userNames = {};
let rooms = [];

const MAX_NAME_LENGTH = 20;

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

/* function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
} 

function isColorUsed(color) {
  return Object.values(userColors).includes(color);
}
*/

function isNameUsed(name) {
  return Object.values(userNames).includes(name);
}

function ifContains(n) {
  if (n.includes("Robbie") || n.includes("robbie")) {
    console.log("Robbie is in the chat!");
  }
}

function generateRandomRoomId() {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let roomId = "";
  for (let i = 0; i < 6; i++) {
    roomId += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return roomId;
}

io.on("connection", (socket) => {
  console.log("a user connected");
  UserOnline += 1;
  console.log(UserOnline);
  io.emit("UserCount", UserOnline);

  socket.roomId = "default_room";
  socket.join(socket.roomId);

  const userId = uuidv4();
  let userColor = "#FFFFFF"; /* stringToColor(userId) */
  let userName = userId.substring(0, MAX_NAME_LENGTH);

  /* while (isColorUsed(userColor)) {
    userColor = stringToColor(userId + Math.random());
  } */

  while (isNameUsed(userName)) {
    userName = userId.substring(0, MAX_NAME_LENGTH);
  }

  /*userColors[socket.id] = userColor;*/
  userNames[socket.id] = userName;

  socket.userId = userName;
  socket.userColor = userColor;

  socket.emit("userIds", { userId: userName, userColor });

  socket.on("disconnect", () => {
    console.log("user disconnected");
    UserOnline -= 1;
    console.log(UserOnline);
    io.emit("UserCount", UserOnline);
    //delete userColors[socket.id];
    delete userNames[socket.id];
  });

  socket.on("chat message", (text) => {
    const sanitizedText = sanitizeHtml(text, {
      allowedTags: [],
      allowedAttributes: {},
    });
    const room = io.to(socket.roomId);

    room.emit("chat message", {
      userId: socket.userId,
      userColor: socket.userColor,
      text: sanitizedText,
    });

    console.log("message: " + sanitizedText);
    ifContains(sanitizedText);
  });

  socket.on("file message", ({ image, fileName, text }) => {
    const sanitizedText = sanitizeHtml(text, {
      allowedTags: [],
      allowedAttributes: {},
    });
    const room = io.to(socket.roomId);

    room.emit("file message", {
      userId: socket.userId,
      userColor: socket.userColor,
      image: image,
      fileName: fileName,
      text: sanitizedText,
    });
    console.log("file");
  });

  socket.on("name changed", (newName) => {
    const sanitizedName = sanitizeHtml(newName, {
      allowedTags: [],
      allowedAttributes: {},
    });

    if (
      sanitizedName.trim() !== "" &&
      sanitizedName.length <= MAX_NAME_LENGTH &&
      !isNameUsed(sanitizedName)
    ) {
      userNames[socket.id] = sanitizedName;
      socket.userId = sanitizedName;
    }
  });

  socket.on("create-room", () => {
    const roomId = generateRandomRoomId();

    if (rooms.includes(roomId)) roomId = generateRandomRoomId();

    socket.leave(socket.roomId);
    socket.roomId = roomId;
    socket.join(roomId);

    rooms.push(roomId);

    socket.emit("create-room", roomId);

    console.log(`Room created: ${roomId}`);
  });

  socket.on("join-room", ({ roomId }) => {
    if (!roomId) return;

    socket.leave(socket.roomId);
    socket.roomId = roomId;
    socket.join(roomId);

    socket.emit("join-room", roomId);

    console.log(`User joined room: ${roomId}`);
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
