const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require("electron-updater")
const isDev = require('electron-is-dev');

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

var foundUpdate = false;
var willUpdate = 0;
const autoUpdateSetup = () => {
	
	autoUpdater.on('update-available', () => {
		foundUpdate = true;
	});
	
	autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
		const dialogOpts = {
			type: 'info',
			buttons: ['Atualizar Depois', 'Reiniciar Aplicação'],
			title: 'Application Update',
			message: process.platform === 'win32' ? releaseNotes : releaseName,
			detail: 'Uma nova versão está disponível. Reinicie a aplicação para atualizar.'
		};
		
		if(willUpdate === 0) {
			dialog.showMessageBox(dialogOpts).then((returnValue) => {
				willUpdate = returnValue.response;
				if (willUpdate === 1) autoUpdater.quitAndInstall();
			});
		}
	});
	
	autoUpdater.on('error', message => {
		console.error('There was a problem updating the application');
		console.error(message);
	});
	
	autoUpdater.checkForUpdates();
	
	setInterval(() => {
		if(foundUpdate === false)
		autoUpdater.checkForUpdates();
	}, 60000)
}

function main() {
	if (!isDev) {
		autoUpdateSetup();
	}
}

main();