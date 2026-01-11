const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
const video = document.querySelector("video");

// const socket_url = "https://api-stream-sandbox.aavgo.com";
const socket_url = "ws://localhost:8080";

var socket = io(socket_url, {
	transports: ["websocket"],
	reconnection: true,
	reconnectionAttempts: 10,
	reconnectionDelay: 1000,
});

let mediaRecorder;

socket.on("requestVideo", () => {
	navigator.mediaDevices
		.getDisplayMedia({
			audio: true,
			video: {
				width: 480,
				height: 270,
				frameRate: 5,
			},
		})
		.then((stream) => {
			mediaRecorder = new MediaRecorder(stream, {
				mimeType: "video/webm; codecs=vp8,opus",
				videoBitsPerSecond: 30 * 1024 * 1024,
			});

			mediaRecorder.addEventListener("dataavailable", (e) => {
				if (e.data.size > 0) {
					console.log("dataAvailable triggered");
					socket.send(e.data);
				} else {
					console.log("No data available to send to backend server");
				}
			});

			mediaRecorder.addEventListener("onerror", (e) => {
				console.error("MediaRecorder error:", e);
			});
			// mediaRecorder.addEventListener("stop", socket.close.bind(socket));

			mediaRecorder.start(1.1 * 1000);
		})
		.catch((e) => console.log(e));
});

socket.on("denyVideoStream", () => {
	console.log("[event] => stopVideo");
	mediaRecorder.stop();
});

socket.on("error", (error) => {
	console.error("Socket error:", error);
});

socket.on("disconnect", () => {
	console.log("Socket disconnected, attempting to reconnect...");
	// Implement reconnection logic if needed
});

const print = (mode) => {
	console.log("Printing started...!!");
	var selectedFile = document.getElementById("fileInput").files;
	if (selectedFile.length > 0) {
		var fileToLoad = selectedFile[0];
		// FileReader function for read the file.
		var fileReader = new FileReader();
		var base64;
		// Onload of file read the file content
		fileReader.onload = function (e) {
			base64 = e.target.result.replace("data:application/pdf;base64,", "");
			// Print data in console
			console.log("base64", base64);
			axios
				.post(
					`http://localhost:5000/MIWATCPIPInteraction/PrintPdf?orientation=${mode}`,
					base64,
					{
						headers: {
							accept: "application/json",
							"Content-Type": "application/json",
						},
					}
				)
				.then((res) => {
					console.log("printer status ", res.data);
					document.getElementById(
						"printerRespoonse"
					).innerHTML = `<p>${res.data}</p>`;
				})
				.catch((err) => {
					console.log("printer status in catch ", err.response.data);
					document.getElementById(
						"printerRespoonse"
					).innerHTML = `<p>${err.response.data}</p>`;
				});
		};
		// Convert data to base64
		fileReader.readAsDataURL(fileToLoad);
	} else {
		document.getElementById(
			"printerRespoonse"
		).innerHTML = `<p color="red">Please Select a file to print..!</p>`;
	}
};

const getPrinterStatus = () => {
	axios
		.get("http://localhost:5000/MIWATCPIPInteraction/GetPrinterStatus")
		.then((res) => {
			console.log("printer status ", res);
			document.getElementById(
				"printerRespoonse"
			).innerHTML = `<p>${res.data}</p>`;
		})
		.catch((err) => {
			console.log("printer status ", err.response.data);
			document.getElementById(
				"printerRespoonse"
			).innerHTML = `<p>${err.response.data}</p>`;
		});
};
