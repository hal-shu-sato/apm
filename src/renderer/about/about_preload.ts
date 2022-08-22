import log from 'electron-log';
import 'source-map-support/register';
import { app, openDialog } from '../../lib/ipcWrapper';
import replaceText from '../../lib/replaceText';

log.catchErrors({
  onError: async (e, versions) => {
    log.error(e);
    log.info(versions);

    await openDialog(
      'エラー',
      `予期しないエラーが発生しました。\nログファイル: ${
        log.transports.file.getFile().path
      }\nエラーメッセージ: ${e.message}`,
      'error'
    );
  },
});

window.addEventListener('click', () => {
  window.close();
});

window.addEventListener('DOMContentLoaded', async () => {
  const appVersion = await app.getVersion();
  replaceText('app-version', appVersion);
  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency]);
  }
});
