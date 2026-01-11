import { io } from "socket.io-client";

const socket_url = "http://localhost:8080"; // Replace with your server URL

export const socket = io(socket_url, { transports: ["websocket"] });
