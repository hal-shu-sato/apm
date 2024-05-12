import { ipcRenderer } from 'electron';

export const app = {
  /**
   * Gets the app's name.
   */
  getName: async function () {
    return (await ipcRenderer.invoke('get-app-name')) as string;
  },

  /**
   * Gets the app's version.
   */
  getVersion: async function () {
    return (await ipcRenderer.invoke('get-app-version')) as string;
  },

  /**
   * Gets a path to a special directory or file associated with `name`.
   * @param {string} name - A name associated with a special directory or file you get.
   */
  getPath: async function (
    name:
      | 'home'
      | 'appData'
      | 'userData'
      | 'cache'
      | 'temp'
      | 'exe'
      | 'module'
      | 'desktop'
      | 'documents'
      | 'downloads'
      | 'music'
      | 'pictures'
      | 'videos'
      | 'recent'
      | 'logs'
      | 'crashDumps',
  ) {
    return (await ipcRenderer.invoke('app-get-path', name)) as string;
  },

  /**
   * Quits the app.
   */
  quit: async function () {
    await ipcRenderer.invoke('app-quit');
  },
};

/**
 * Whether the app is exe version.
 */
export async function isExeVersion() {
  return (await ipcRenderer.invoke('is-exe-version')) as boolean;
}

/**
 * Check the update of the app.
 */
export async function checkUpdate() {
  await ipcRenderer.invoke('check-update');
}

/**
 * Opens a file explorer and returns whether the directory exists.
 * @param {string} relativePath - A relative path from the data directory.
 */
export async function openPath(relativePath: string) {
  return (await ipcRenderer.invoke('open-path', relativePath)) as boolean;
}

/**
 * Returns the temporary file path.
 * @param {string} relativePath - A relative path from the data directory.
 * @param {string} [keyText] - String used to generate the hash.
 * @returns {Promise<string>} The temporary file path.
 */
export async function getTempFilePath(
  relativePath: string,
  keyText: string = undefined,
) {
  return ipcRenderer.invoke(
    'get-temp-file-path',
    relativePath,
    keyText,
  ) as Promise<string>;
}

/**
 * Returns whether the file exists.
 * @param {string} filePath - A file path
 * @returns {Promise<boolean>} Whether the file exists
 */
export async function existsFile(filePath: string) {
  return ipcRenderer.invoke('exists-file', filePath) as Promise<boolean>;
}

/**
 * Opens a directory dialog and returns the path selected by a user.
 * @param {string} title - A title of the dialog.
 * @param {string} defaultPath - A path of the initial directory.
 */
export async function openDirDialog(title: string, defaultPath: string) {
  return (await ipcRenderer.invoke(
    'open-dir-dialog',
    title,
    defaultPath,
  )) as string[];
}

/**
 * Opens a error dialog.
 * @param {string} title - A title of the dialog.
 * @param {string} message - A message showed in the dialog.
 * @param {'none' | 'info' | 'error' | 'question' | 'warning'} [type] - A type of the dialog.
 */
export async function openDialog(
  title: string,
  message: string,
  type?: 'none' | 'info' | 'error' | 'question' | 'warning',
) {
  await ipcRenderer.invoke('open-dialog', title, message, type);
}

/**
 * Opens a yes-no dialog and returns a response.
 * @param {string} title - A title of the dialog.
 * @param {string} message - A message showed in the dialog.
 */
export async function openYesNoDialog(title: string, message: string) {
  return (await ipcRenderer.invoke(
    'open-yes-no-dialog',
    title,
    message,
  )) as boolean;
}

/**
 * Gets nicommons' data.
 * @param {string} id - A nicommons ID.
 */
export async function getNicommonsData(id: string) {
  return (await ipcRenderer.invoke('get-nicommons-data', id)) as unknown;
}

/**
 * Opens the about window.
 */
export async function openAboutWindow() {
  await ipcRenderer.invoke('open-about-window');
}

/**
 * Opens the confirm dialog for migration v1 to v2.
 */
export async function migration1to2ConfirmDialog() {
  return (await ipcRenderer.invoke('migration1to2-confirm-dialog')) as number;
}

/**
 * Opens the input dialog of a data url for migration v1 to v2.
 */
export async function migration1to2DataurlInputDialog() {
  return (await ipcRenderer.invoke(
    'migration1to2-dataurl-input-dialog',
  )) as string;
}

/**
 * Changes the zoom factor of the main window.
 * @param {number} zoomFactor - A zoom factor to be changed to. Zoom factor is zoom percent divided by 100, so 300% = 3.0.
 */
export async function changeMainZoomFactor(zoomFactor: number) {
  await ipcRenderer.invoke('change-main-zoom-factor', zoomFactor);
}

/**
 * Downloads a file.
 * @param {string} url - The URL of a file to download.
 * @param {object} [options] - Options
 * @param {boolean} [options.loadCache] - Whether to load a cache file.
 * @param {string} [options.subDir] - A directory name under a data directory.
 * @param {string} [options.keyText] - String used to generate the hash.
 * @returns {Promise<string>} File path (on success) or undefined (on failure).
 */
export async function download(
  url: string,
  options?: { loadCache?: boolean; subDir?: string; keyText?: string },
) {
  return (await ipcRenderer.invoke('download', url, options)) as string;
}

/**
 * Opens the browser window.
 * @param {string} url - A URL to be opened.
 * @param {'core'|'package'} type - A type of the file to be downloaded.
 */
export async function openBrowser(url: string, type: 'core' | 'package') {
  return (await ipcRenderer.invoke('open-browser', url, type)) as {
    savePath: string;
    history: string[];
  } | null;
}

/**
 * Writes the text into the clipboard as plain text.
 * @param {string} text - plain text.
 */
export async function clipboardWriteText(text: string) {
  await ipcRenderer.invoke('clipboard-writeText', text);
}
