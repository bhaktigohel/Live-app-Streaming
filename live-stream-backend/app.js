const app = require("express")();
const server = require("http").createServer(app);
const io = require("socket.io")(server, { allowEIO3: true });
const port = process.env.PORT || 8080;

io.on("connection", (socket) => {
	console.log("user Connected", socket.id);
	socket.on("chat", (message) => {
		// console.log('From client: ', message)
		io.broadcast("chat", message);
	});

	socket.on("disconnect", function () {
		console.log("user disconnected");
	});

	socket.on("subscribeTopic", (topic) => {
		console.log("topic subscription ", topic);
		socket.join(Number(topic));
	});

	socket.on("requestVideo", () => {
		console.log("video Stream Request  received..!");
		const room = [...socket.rooms].find((r) => r != socket.id);
		console.log("room", room);
		socket.to(Number(room)).emit("requestVideo");
	});

	socket.on("denyVideoStream", () => {
		console.log("video Stream Request  decliened..!");
		const room = [...socket.rooms].find((r) => r != socket.id);
		socket.to(Number(room)).emit("denyVideoStream");
	});

	socket.on("message", (data) => {
		console.log("video Stream received...!!!", ...socket.rooms);
		const room = [...socket.rooms].find((r) => r != socket.id);
		console.log("room", room);
		socket.to(Number(room)).emit("videoStream", data);
	});

	socket.on("error", (error) => {
		console.error("Socket error:", error);
	});
});

io.on("error", (error) => {
	console.error("Socket.io error:", error);
});

server.listen(port, function () {
	console.log(`Listening on port ${port}`);
});
