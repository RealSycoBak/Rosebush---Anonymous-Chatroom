var socket = io();
var messages = document.getElementById("messages");
var form = document.getElementById("form");
var inputfile = document.getElementById("inputfile");
var inputmsg = document.getElementById("inputmsg");
var userId = null;

form.addEventListener("submit", function (e) {
  e.preventDefault();
  if (inputfile.files && inputfile.files[0]) {
    const file = inputfile.files[0];
    const reader = new FileReader();
    const messageText = inputmsg.value;

    reader.onload = function (e) {
      socket.emit("file message", {
        image: e.target.result,
        fileName: file.name,
        text: messageText,
      });
    };

    reader.readAsDataURL(file);
  } else if (inputmsg.value.trim() !== "") {
    socket.emit("chat message", inputmsg.value);
  }

  inputmsg.value = "";
  inputfile.value = "";
});

socket.on("userIds", function (userIds) {
  userId = userIds;
});

/* function stringToColor(str) { 
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
} */

socket.on("chat message", function (data) {
  const userColor = "#FFFFFF"; /*stringToColor(data.userId)*/

  var currentDate = new Date();
  var timeString = currentDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "numeric",
  });
  var item = document.createElement("li");

  item.style.color = userColor;

  item.innerHTML = `<strong>${data.userId} </strong><em style="font-size: 12px;">${timeString}</em> <br/> ${data.text}`;
  messages.appendChild(item);
  messages.scrollTo(0, messages.scrollHeight);
});

socket.on("file message", function (data) {
  const userColor = "#FFFFFF"; /*stringToColor(data.userId)*/

  var currentDate = new Date();
  var timeString = currentDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "numeric",
  });
  var item = document.createElement("li");

  item.style.color = userColor;

  item.innerHTML = `<strong>${data.userId} </strong><em style="font-size: 12px;">${timeString}</em> <br/> ${data.text} <br/> <img src="${data.image}" alt="User Image" />`;

  messages.appendChild(item);
  messages.scrollTo(0, messages.scrollHeight);
});

socket.on("UserCount", function (userCount) {
  document.getElementById("userCount").innerHTML =
    `Online: <span> ${userCount}`;
});

window.onload = function () {
  // var userName = prompt("Enter your name:");
  var userName = "bob";

  if (userName && userName.trim() !== "") {
    socket.emit("name changed", userName);
  }
};

document
  .getElementById("changeNameButton")
  .addEventListener("click", function () {
    var newName = prompt("Enter your new name:");
    if (newName && newName.trim() !== "") {
      socket.emit("name changed", newName);
    }
  });

function createChatRoom() {
  socket.emit("create-room");
}

function joinChatRoom() {
  var roomId = prompt("Enter Room ID:");

  socket.emit("join-room", { roomId });
}

function displayRoom(roomId) {
  messages.innerHTML = "";

  messages.innerHTML += `<li class="info-message">Room ID: ${roomId}</li>`;
}

socket.on("join-room", function (roomId) {
  messages.innerHTML = "";
  console.log("Joined room: " + roomId);
  displayRoom(roomId);
});

socket.on("create-room", function (roomId) {
  messages.innerHTML = "";
  console.log("Created room: " + roomId);
  displayRoom(roomId);
});
