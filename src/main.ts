import { app, BrowserWindow, Menu, dialog, ipcMain, shell } from 'electron';
import { download } from 'electron-dl';
import log from 'electron-log';
import debug from 'electron-debug';
import windowStateKeeper from 'electron-window-state';
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import prompt from 'electron-prompt';
import { getHash } from './lib/getHash';
import shortcut from './lib/shortcut';

declare const SPLASH_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const ABOUT_WINDOW_WEBPACK_ENTRY: string;
declare const ABOUT_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const PACKAGE_MAKER_WINDOW_WEBPACK_ENTRY: string;
declare const PACKAGE_MAKER_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

log.catchErrors({
  showDialog: false,
  onError: () => {
    const options = {
      title: 'エラー',
      message: `予期しないエラーが発生したため、AviUtl Package Managerを終了します。\nログファイル: ${
        log.transports.file.getFile().path
      }`,
      type: 'error',
    };
    if (app.isReady()) {
      dialog.showMessageBoxSync(options);
    } else {
      dialog.showErrorBox(options.title, options.message);
    }

    app.quit();
  },
});

shortcut.uninstaller(app.getPath('appData'));
if (require('electron-squirrel-startup')) app.quit();

import updateElectronApp from 'update-electron-app';
updateElectronApp();

const isDevEnv = process.env.NODE_ENV === 'development';
if (isDevEnv) app.setPath('userData', app.getPath('userData') + '_Dev');
debug({ showDevTools: false }); // Press F12 to open DevTools

import Store from 'electron-store';
Store.initRenderer();

log.debug(process.versions);

const icon =
  process.platform === 'linux'
    ? path.join(__dirname, '../icon/apm1024.png')
    : undefined;

ipcMain.handle('get-app-version', (event) => {
  return app.getVersion();
});

ipcMain.handle('app-get-path', (event, name) => {
  return app.getPath(name);
});

ipcMain.handle('app-quit', (event) => {
  app.quit();
});

ipcMain.handle('open-path', (event, relativePath) => {
  const folderPath = path.join(app.getPath('userData'), 'Data/', relativePath);
  const folderExists = fs.existsSync(folderPath);
  if (folderExists) execSync(`start "" "${folderPath}"`);
  return folderExists;
});

ipcMain.handle('exists-temp-file', (event, relativePath, keyText) => {
  let filePath = path.join(app.getPath('userData'), 'Data/', relativePath);
  if (keyText) {
    filePath = path.join(
      path.dirname(filePath),
      getHash(keyText) + '_' + path.basename(filePath)
    );
  }
  return { exists: fs.existsSync(filePath), path: filePath };
});

ipcMain.handle('open-dir-dialog', async (event, title, defaultPath) => {
  const win = BrowserWindow.getFocusedWindow();
  const dir = await dialog.showOpenDialog(win, {
    title: title,
    defaultPath: defaultPath,
    properties: ['openDirectory'],
  });
  return dir.filePaths;
});

ipcMain.handle('open-err-dialog', async (event, title, message) => {
  const win = BrowserWindow.getFocusedWindow();
  await dialog.showMessageBox(win, {
    title: title,
    message: message,
    type: 'error',
  });
});

ipcMain.handle('open-yes-no-dialog', async (event, title, message) => {
  const win = BrowserWindow.getFocusedWindow();
  const response = await dialog.showMessageBox(win, {
    title: title,
    message: message,
    type: 'warning',
    buttons: ['はい', `いいえ`],
    cancelId: 1,
  });
  if (response.response === 0) {
    return true;
  } else {
    return false;
  }
});

const allowedHosts: string[] = [];

app.on(
  'certificate-error',
  async (event, webContents, url, error, certificate, callback) => {
    if (error === 'net::ERR_SSL_OBSOLETE_VERSION') {
      event.preventDefault();
      const host = new URL(url).hostname;
      if (allowedHosts.includes(host)) {
        callback(true);
      } else {
        const win = BrowserWindow.getFocusedWindow();
        const response = await dialog.showMessageBox(win, {
          title: '安全ではない接続',
          message: `このサイトでは古いセキュリティ設定を使用しています。このサイトに情報を送信すると流出する恐れがあります。`,
          detail: error,
          type: 'warning',
          buttons: ['戻る', `${host}にアクセスする（安全ではありません）`],
          cancelId: 0,
        });
        if (response.response === 1) {
          allowedHosts.push(host);
          callback(true);
        } else {
          callback(false);
        }
      }
    }
  }
);

/**
 * Launch the app.
 */
function launch() {
  const splashWindow = new BrowserWindow({
    width: 640,
    height: 360,
    center: true,
    frame: false,
    show: false,
    icon: icon,
  });

  splashWindow.once('ready-to-show', () => {
    splashWindow.show();
  });

  splashWindow.loadURL(SPLASH_WINDOW_WEBPACK_ENTRY);

  const mainWindowState = windowStateKeeper({
    defaultWidth: 800,
    defaultHeight: 600,
  });

  const mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    minWidth: 320,
    minHeight: 240,
    show: false,
    icon: icon,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.match(/^http/)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    if (details.url.match(/^http/)) {
      shell.openExternal(details.url);
    }
    return { action: 'deny' };
  });

  mainWindow.once('show', () => {
    mainWindowState.manage(mainWindow);
  });

  const template = [
    {
      label: 'apm',
      submenu: [
        {
          label: `${app.name}について`,
          click: () => {
            const aboutPath = ABOUT_WINDOW_WEBPACK_ENTRY;
            const aboutWindow = new BrowserWindow({
              width: 480,
              height: 360,
              frame: false,
              resizable: false,
              modal: true,
              parent: mainWindow,
              icon: icon,
              webPreferences: {
                preload: ABOUT_WINDOW_PRELOAD_WEBPACK_ENTRY,
              },
            });
            aboutWindow.once('close', () => {
              if (!aboutWindow.isDestroyed()) {
                aboutWindow.destroy();
              }
            });
            aboutWindow.once('ready-to-show', () => {
              aboutWindow.show();
            });
            aboutWindow.loadURL(aboutPath);
          },
        },
        {
          label: `インストール用データの作成`,
          click: () => {
            const packageMakerPath = PACKAGE_MAKER_WINDOW_WEBPACK_ENTRY;
            const packageMakerWindow = new BrowserWindow({
              width: 480,
              height: 360,
              modal: true,
              parent: mainWindow,
              icon: icon,
              webPreferences: {
                preload: PACKAGE_MAKER_WINDOW_PRELOAD_WEBPACK_ENTRY,
              },
            });
            packageMakerWindow.once('close', () => {
              if (!packageMakerWindow.isDestroyed()) {
                packageMakerWindow.destroy();
              }
            });
            packageMakerWindow.once('ready-to-show', () => {
              packageMakerWindow.show();
            });
            packageMakerWindow.loadURL(packageMakerPath);
          },
        },
        {
          label: 'フィードバックを送る（GitHub）（外部ブラウザが開きます）',
          click: () => {
            shell.openExternal('https://github.com/hal-shu-sato/apm/issues');
          },
        },
        {
          label:
            'フィードバックを送る（Googleフォーム）（外部ブラウザが開きます）',
          click: () => {
            shell.openExternal(
              'https://docs.google.com/forms/d/e/1FAIpQLSf0N-X_u_abi8rrWHVDdiK3YeYuQ7J1f8bQAy6QTD-OR94DWQ/viewform?usp=sf_link'
            );
          },
        },
        {
          label: '終了',
          click: () => {
            app.quit();
          },
        },
      ],
    },
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  ipcMain.handle('migration1to2-confirm-dialog', async (event) => {
    return (
      await dialog.showMessageBox(mainWindow, {
        title: '確認',
        message: `お使いのバージョンのapmは現在設定されているデータ取得先に対応しておりません。新しいデータ取得先への移行が必要です。`,
        type: 'warning',
        buttons: [
          'キャンセル',
          '新しいデータ取得先を入力する',
          'デフォルトのデータ取得先を使う',
        ],
        cancelId: 0,
      })
    ).response;
  });

  ipcMain.handle('migration1to2-dataurl-input-dialog', async (event) => {
    return await prompt(
      {
        title: '新しいデータ取得先の入力',
        label: '新しいデータ取得先のURL（例: https://example.com/data/）',
        width: 500,
        height: 300,
        type: 'input',
      },
      mainWindow
    );
  });

  ipcMain.handle('change-main-zoom-factor', (event, zoomFactor) => {
    mainWindow.webContents.setZoomFactor(zoomFactor);
  });

  ipcMain.handle(
    'download',
    async (event, url, loadCache = false, subDir = '', keyText) => {
      const tmpDirectory = path.join(app.getPath('userData'), 'Data/', subDir);
      const opt = {
        overwrite: true,
        directory: ['.zip', '.lzh', '.7z', '.rar'].includes(path.extname(url))
          ? path.join(tmpDirectory, 'archive')
          : tmpDirectory,
      };

      const tmpFilePath = keyText
        ? path.join(opt.directory, getHash(keyText) + '_' + path.basename(url))
        : path.join(opt.directory, path.basename(url));
      if (loadCache && fs.existsSync(tmpFilePath)) return tmpFilePath;

      let savePath;
      if (url.startsWith('http')) {
        savePath = (await download(mainWindow, url, opt)).getSavePath();
      } else {
        savePath = path.join(opt.directory, path.basename(url));
        fs.mkdir(path.dirname(savePath), { recursive: true });
        fs.copyFileSync(url, savePath);
      }

      if (keyText) {
        const renamedPath = path.join(
          path.dirname(savePath),
          getHash(keyText) + '_' + path.basename(savePath)
        );
        fs.renameSync(savePath, renamedPath);
        savePath = renamedPath;
      }
      return savePath;
    }
  );

  ipcMain.handle('open-browser', async (event, url, type) => {
    const browserWindow = new BrowserWindow({
      width: 800,
      height: 600,
      minWidth: 240,
      minHeight: 320,
      webPreferences: { sandbox: true },
      parent: mainWindow,
      modal: true,
      icon: icon,
    });

    mainWindow.once('closed', (event) => {
      if (!browserWindow.isDestroyed()) {
        browserWindow.destroy();
      }
    });

    browserWindow.loadURL(url);

    return await new Promise((resolve) => {
      const history: string[] = [];

      browserWindow.webContents.on('did-navigate', (e, url) => {
        history.push(url);
      });

      browserWindow.webContents.session.once(
        'will-download',
        (event, item, webContents) => {
          if (!browserWindow.isDestroyed()) browserWindow.hide();

          const ext = path.extname(item.getFilename());
          const dir = path.join(app.getPath('userData'), 'Data');
          if (['.zip', '.lzh', '.7z', '.rar'].includes(ext)) {
            item.setSavePath(
              path.join(dir, type, 'archive/', item.getFilename())
            );
          } else {
            item.setSavePath(path.join(dir, type, item.getFilename()));
          }

          item.once('done', (e, state) => {
            history.push(...item.getURLChain(), item.getFilename());
            resolve({ savePath: item.getSavePath(), history: history });
            browserWindow.destroy();
          });
        }
      );

      browserWindow.once('closed', (event) => {
        resolve(null);
      });
    });
  });

  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      mainWindow.show();
      splashWindow.hide();
      splashWindow.destroy();
    }, 2000);
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
}

app.whenReady().then(() => {
  launch();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) launch();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
