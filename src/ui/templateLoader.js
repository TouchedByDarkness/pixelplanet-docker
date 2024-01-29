/*
 * class for storing templates for minimap / overlay
 */

import FileStorage from '../utils/FileStorage';
import {
  removeTemplate,
  listTemplate,
} from '../store/actions/templates';
import Template from './Template';

const STORE_NAME = 'templates';

class TemplateLoader {
  #store;
  #fileStorage = new FileStorage(STORE_NAME);
  // Map of templates
  #templates = new Map();
  // if loader is ready
  ready = false;

  async initialize(store) {
    this.#store = store;
    await this.#fileStorage.initialize();
    await this.syncDB();
    this.ready = true;
  }

  async getTemplate(id) {
    let template = this.#templates.get(id);
    if (template) {
      return template.image;
    }
    template = await this.loadExistingTemplate(id);
    if (template) {
      return template.image;
    }
    return null;
  }

  /*
  getTemplatesInView() {
    this.#store.templates
  }
  */

  /*
   * sync database to store,
   * remove templates with images that aren't present in both
   */
  async syncDB() {
    try {
      const { list } = this.#store.getState().templates;
      const ids = list.map((t) => t.imageId);
      const deadIds = await this.#fileStorage.sync(ids);
      list.filter((t) => deadIds.includes(t.imageId)).forEach((t) => {
        this.#store.dispatch(removeTemplate(t.title));
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(
        `Error on syncing templates store and indexedDB: ${err.message}`,
      );
    }
  }

  /*
   * load all missing template from store
   */
  async loadAllMissing() {
    const { templates } = this.#store.getState();
    const ids = templates.list.map((t) => t.imageId);
    const toLoad = ids.filter((i) => !this.#templates.has(i));
    for (const id of toLoad) {
      // eslint-disable-next-line no-await-in-loop
      await this.loadExistingTemplate(id);
    }
  }

  /*
   * load a template from db
   * @param imageId
   */
  async loadExistingTemplate(imageId) {
    try {
      const fileData = await this.#fileStorage.loadFile(imageId);
      if (!fileData) {
        throw new Error('File does not exist in indexedDB');
      }
      const { mimetype, buffer } = fileData;
      const template = new Template(imageId);
      await template.fromBuffer(buffer, mimetype);
      this.#templates.set(imageId, template);
      return template;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Error loading template ${imageId}: ${err.message}`);
      return null;
    }
  }

  /*
   * add template from File or Blob
   * @param file, title, canvasId, x, y self explenatory
   * @param element optional image or canvas element where file is already loaded,
   *                can be used to avoid having to load it multiple times
   */
  async addFile(file, title, canvasId, x, y, element = null) {
    try {
      const imageId = await this.#fileStorage.saveFile(file);
      const template = new Template(imageId);
      let dimensions;
      if (element) {
        dimensions = await template.fromImage(element);
      } else {
        dimensions = await template.fromFile(file);
      }
      this.#templates.set(imageId, template);
      this.#store.dispatch(listTemplate(
        imageId, title, canvasId, x, y, ...dimensions,
      ));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Error saving template ${title}: ${err.message}`);
    }
  }
}

const templateLoader = new TemplateLoader();

export default templateLoader;
