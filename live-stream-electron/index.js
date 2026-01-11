const {
	app,
	BrowserWindow,
	Menu,
	screen,
	session,
	ipcMain,
} = require("electron");

const fs = require("fs");
const path = require("path");

const createWindow = async () => {
	const displays = screen.getAllDisplays();
	const externalDisplay = displays.find((display) => {
		return display.bounds.x !== 0 || display.bounds.y !== 0;
	});
	let win;
	if (externalDisplay) {
		win = new BrowserWindow({
			x: externalDisplay.bounds.x,
			y: externalDisplay.bounds.y,
			width: 720,
			height: 405,
			fullscreen: false,
			frame: true,
			webPreferences: {
				devTools: true,
				nodeIntegration: false,
				webviewTag: true,
			},
		});
	} else {
		win = new BrowserWindow({
			width: 720,
			height: 405,
			fullscreen: false,
			frame: true,
			webPreferences: {
				devTools: true,
				nodeIntegration: false,
				webviewTag: true,
			},
		});
	}

	session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
		callback({ video: request.frame, audio: "loopback" });
	});

	win.webContents.openDevTools();
	Menu.setApplicationMenu(null);
	win.loadFile("index.html");

	await fs.promises.readdir(
		path.resolve(
			win.webContents.session
				.getStoragePath()
				.replace("Remote-Stream", "VirtualKioskSandbox"),
			"logs"
		)
	);
	// console.log(logDir);
	// win.webContents.send(`logDir`, win.webContents.session.getStoragePath());
};

app.whenReady().then(() => {
	createWindow();
});

ipcMain.handle("logDirectory", async () => {
	try {
		const logDir = await fs.promises.readdir(
			path.resolve(
				win.webContents.session
					.getStoragePath()
					.replace("electron-bash", "VirtualKioskSandbox"),
				"logs"
			)
		);
		console.log(logDir);
		return { success: 1, files: logDir };
	} catch (error) {
		return { success: 0, files: [], error };
	}
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
