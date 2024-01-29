/*
 * store files in indexedDB on incrementing indices
 */

const CURRENT_VERSION = 1;
const DB_NAME = 'ppfun_files';

// TODO make sure we get sane errors on reject()

class FileStorage {
  type;
  static db;

  constructor(type) {
    this.type = type;
  }

  async initialize() {
    await FileStorage.openDB();
    return this;
  }

  static openDB() {
    if (FileStorage.db) {
      return FileStorage.db;
    }
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, CURRENT_VERSION);

      request.onsuccess = (event) => {
        console.log('Successfully opened indexedDB');
        const db = event.target.result;

        db.onerror = (evt) => {
          console.error('indexedDB error:', evt.target.error);
        };

        FileStorage.db = db;
        resolve(db);
      };

      request.onupgradeneeded = (event) => {
        const os = event.target.result.createObjectStore('files', {
          autoIncrement: true,
        });
        os.createIndex('type', 'type', { unique: false });
        os.createIndex('mimetype', 'mimetype', { unique: false });
      };

      request.onerror = () => {
        console.error('Error on opening indexedDB:', request.error);
        reject();
      };
    });
  }

  async saveFile(files) {
    const { db } = FileStorage;
    if (!db) {
      return null;
    }
    const fileArray = Array.isArray(files) ? files : [files];
    const buffers = await Promise.all(fileArray.map((f) => f.arrayBuffer()));
    console.log('buffers', buffers);

    return new Promise((resolve, reject) => {
      const result = [];
      const transaction = db.transaction('files', 'readwrite');

      transaction.oncomplete = () => {
        console.log('Success on saving files to indexedDB', result);
        resolve(Array.isArray(files) ? result : result[0]);
      };
      transaction.onabort = (event) => {
        event.stopPropagation();
        console.log('Saving files to indexedDB aborted:', event, result);
        reject();
      };

      const os = transaction.objectStore('files');
      fileArray.forEach((file, index) => {
        console.log('type', this.type, 'mime', file.type, 'buffer', buffers[index], 'file', file);
        result.push(null);
        os.add({
          type: this.type,
          mimetype: file.type,
          buffer: buffers[index],
        }).onsuccess = (event) => {
          result[index] = event.target.result;
        };
      });
    });
  }

  // eslint-disable-next-line class-methods-use-this
  loadFile(ids) {
    const { db } = FileStorage;
    if (!db) {
      return null;
    }
    const indicesArray = Array.isArray(ids) ? ids : [ids];

    return new Promise((resolve, reject) => {
      const result = [];
      const transaction = db.transaction('files', 'readonly');

      transaction.oncomplete = () => {
        console.log('Success on loading file', result);
        resolve(Array.isArray(ids) ? result : result[0]);
      };
      transaction.onabort = (event) => {
        event.stopPropagation();
        console.log('Loading file from indexedDB aborted:', event.target.error);
        reject();
      };

      const os = transaction.objectStore('files');
      indicesArray.forEach((id, index) => {
        result.push(null);
        os.get(id).onsuccess = (event) => {
          result[index] = event.target.result;
        };
      });
    });
  }

  deleteFile(ids) {
    const { db } = FileStorage;
    if (!db) {
      return null;
    }
    const indicesArray = Array.isArray(ids) ? ids : [ids];

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('files', 'readwrite');

      transaction.oncomplete = (event) => {
        console.log(
          `Successfully deleted ${indicesArray.length} files from indexedDB`,
        );
        resolve();
      };
      transaction.onabort = (event) => {
        event.stopPropagation();
        console.log('Saving files to indexedDB aborted:', event);
        reject();
      };

      const os = transaction.objectStore('files');
      indicesArray.forEach((id) => {
        os.delete(id);
      });
    });
  }

  getAllKeys() {
    const { db } = FileStorage;
    if (!db) {
      return null;
    }
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('files', 'readonly');
      const request = transaction.objectStore('files')
        .index('type')
        .getAllKeys(this.type);

      request.onsuccess = (event) => {
        console.log('got all keys', event.target.result);
        resolve(event.target.result);
      };
      transaction.onabort = (event) => {
        event.stopPropagation();
        console.log('GetAllKeys aborted:', event.target);
        reject(event.target.error);
      };
    });
  }

  /*
   * deletes keys that are in storage but are not in given array
   * @param ids array of ids
   * @return array of ids that are given but not in db
   */
  async sync(ids) {
    const allKeys = await this.getAllKeys();
    const toDelete = allKeys.filter((i) => !ids.includes(i));
    if (toDelete.length) {
      console.log('Templaes: Keys in db but not in store', toDelete);
      await this.deleteFile(toDelete);
    }
    const deadIds = ids.filter((i) => !allKeys.includes(i));
    if (deadIds.length) {
      console.log('Templates: Keys in store but not in db', deadIds);
    }
    return deadIds;
  }
}

export default FileStorage;
