import { useEffect, useRef, useState } from "react";
import "./App.css";
// Removed duplicate imports
import { socket } from "./socket";
import { BrowserRouter, Route, Routes } from "react-router-dom";

function StreamingComponent() {
	const [isStreamStarted, setIsStreamStarted] = useState(false);
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const mediaSourceRef = useRef<MediaSource | null>(null);
	const sourceBufferRef = useRef<SourceBuffer | null>(null);

	useEffect(() => {
		window.addEventListener("beforeunload", handleExit);

		return () => {
			window.removeEventListener("beforeunload", handleExit);
		};
	}, []);

	/* useEffect(() => {
		if (isFirstRender?.current) {
			// This will run only once when the component mounts
			// Request video stream when the component mounts

			console.log(kioskID, "kioskID");
			setTimeout(() => {
				console.log(
					decryptKioskId(kioskID.replaceAll("plus", "+")),
					"decryptKioskId"
				);
				requestVideo(decryptKioskId(kioskID.replaceAll("plus", "+")));
			}, 2000);
			isFirstRender.current = false;
		}
	}, []); */

	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;
		const mediaSource = new MediaSource();
		mediaSourceRef.current = mediaSource;
		// create a object URL and assign to the video tag
		video.src = URL.createObjectURL(mediaSource);

		const onSourceOpen = () => {
			// Mime type should match with electron app media recorder settings
			const mimeType = 'video/webm; codecs="vp8, opus"';
			if (!MediaSource.isTypeSupported(mimeType)) {
				console.error("MIME type not supported:", mimeType);
				return;
			}
			// link mediaSource and sourceBuffer with each other
			const sourceBuffer = mediaSource.addSourceBuffer(mimeType);
			sourceBufferRef.current = sourceBuffer;

			sourceBuffer.addEventListener("error", (e) => {
				console.error("SourceBuffer error:", e);
			});

			sourceBuffer.addEventListener("updateend", () => {
				console.log("SourceBuffer update finished");
			});

			sourceBuffer.addEventListener("abort", () => {
				console.log("SourceBuffer update aborted");
			});

			socket.on(
				"videoStream",
				(bufferData: ArrayBuffer | Uint8Array | number[]) => {
					const sb = sourceBufferRef.current;
					if (!sb || sb.updating) {
						console.log("SourceBuffer is updating or not available");
						return;
					}
					try {
						let chunk: Uint8Array;
						if (bufferData instanceof ArrayBuffer) {
							chunk = new Uint8Array(bufferData);
						} else if (bufferData instanceof Uint8Array) {
							chunk = bufferData;
						} else {
							chunk = new Uint8Array(bufferData);
						}
						sb.appendBuffer(chunk);
					} catch (error) {
						console.error("Error appending buffer:", error);
					}
				}
			);

			socket.on("disconnect", () => {
				// Optionally handle disconnection
				console.log("Socket disconnected");
			});
		};

		mediaSource.addEventListener("sourceopen", onSourceOpen, { once: true });

		return () => {
			stopVideo();
			mediaSource.removeEventListener("sourceopen", onSourceOpen);
			socket.off("videoStream");
			socket.off("disconnect");
		};
	}, []);

	const handleExit = (event: BeforeUnloadEvent) => {
		// Some browsers require preventDefault and setting returnValue
		event.preventDefault();
		console.log("unload event triggered, stopping video stream");
		socket.emit("denyVideoStream");
		socket.disconnect();
		event.returnValue = "";
	};

	const requestVideo = () => {
		setIsStreamStarted(true);
		console.log("requestVideo");
		socket.emit("requestVideo");
	};

	const stopVideo = () => {
		socket.emit("denyVideoStream");
	};

	return (
		<>
			{!isStreamStarted && (
				<div
					style={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
					}}>
					<p>
						Click <button onClick={requestVideo}>Here</button> to start stream
					</p>
				</div>
			)}

			<video
				ref={videoRef}
				width="405"
				height="720"
				autoPlay
				controls
				muted></video>
		</>
	);
}

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<StreamingComponent />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
