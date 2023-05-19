// const { PORT = 8000 } = process.env;
// const app = require("./app");




// const listener = () => console.log(`Listening on Port ${PORT}!`);
// app.listen(PORT, listener);

const express = require("express");
const app = express();
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

app.use(express.json());
app.use(cors);
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

io.on("connection", (socket) => {
  console.log(socket.id);
  socket.on("send-message", (message) => {
    console.log(message);
    socket.broadcast.emit("chat", message);
  });
});

server.listen(8000, () => {
  console.log("app listening at port 8000");
});
