/*
 * store files in indexedDB on incrementing indices
 */

const CURRENT_VERSION = 1;
const DB_NAME = 'ppfun_files';

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
        const db = event.target.result;

        db.onerror = (evt) => {
          // eslint-disable-next-line no-console
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
        // eslint-disable-next-line no-console
        console.error('Error on opening indexedDB:', request.error);
        reject(request.error);
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

    return new Promise((resolve, reject) => {
      const result = [];
      const transaction = db.transaction('files', 'readwrite');

      transaction.oncomplete = () => {
        resolve(Array.isArray(files) ? result : result[0]);
      };
      transaction.onabort = (event) => {
        event.stopPropagation();
        reject(event.target.error);
      };

      const os = transaction.objectStore('files');
      fileArray.forEach((file, index) => {
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

  async updateFile(id, file) {
    const { db } = FileStorage;
    if (!db) {
      return null;
    }
    const buffer = await file.arrayBuffer();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('files', 'readwrite');

      transaction.onabort = (event) => {
        event.stopPropagation();
        reject(event.target.error);
      };

      transaction.objectStore('files').put({
        type: this.type,
        mimetpe: file.type,
        buffer,
      }, id).onsuccess = (event) => resolve(event.target.result);
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
        resolve(Array.isArray(ids) ? result : result[0]);
      };
      transaction.onabort = (event) => {
        event.stopPropagation();
        reject(event.target.error);
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

  // eslint-disable-next-line class-methods-use-this
  deleteFile(ids) {
    const { db } = FileStorage;
    if (!db) {
      return null;
    }
    const indicesArray = Array.isArray(ids) ? ids : [ids];

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('files', 'readwrite');

      transaction.oncomplete = () => {
        resolve();
      };
      transaction.onabort = (event) => {
        event.stopPropagation();
        reject(event.target.error);
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
        resolve(event.target.result);
      };
      transaction.onabort = (event) => {
        event.stopPropagation();
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
      // eslint-disable-next-line no-console
      console.log('Templaes: Keys in db but not in store', toDelete);
      await this.deleteFile(toDelete);
    }
    const deadIds = ids.filter((i) => !allKeys.includes(i));
    if (deadIds.length) {
      // eslint-disable-next-line no-console
      console.log('Templates: Keys in store but not in db', deadIds);
    }
    return deadIds;
  }
}

export default FileStorage;
