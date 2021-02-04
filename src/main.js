const { app, BrowserWindow, ipcMain } = require('electron')
var path = require('path');
var win = undefined;

function createWindow () {
	win = new BrowserWindow({
		width: 1500,
		height: 720,
		webPreferences: {
			nodeIntegration: true
		}
	});

	win.loadFile(path.join(__dirname, './pages/index/index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

ipcMain.on('get-aluno-profile-page', function (event, args) {
	win.loadFile(path.join(__dirname, './pages/aluno_info/aluno_info.html'));
});