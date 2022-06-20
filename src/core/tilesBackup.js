/*
 * Offer functions for Canvas backups
 *
 */

/* eslint-disable no-console */

import sharp from 'sharp';
import fs from 'fs';
import { commandOptions } from 'redis';

import Palette from './Palette';
import { TILE_SIZE } from './constants';


/*
 * Copy canvases from one redis instance to another
 * @param canvasRedis redis from where to get the data
 * @param backupRedis redis where to write the data to
 * @param canvases Object with all canvas informations
 */
export async function updateBackupRedis(canvasRedis, backupRedis, canvases) {
  const ids = Object.keys(canvases);
  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i];
    const canvas = canvases[id];
    if (canvas.v || canvas.hid) {
      // ignore 3D and hiddedn canvases
      continue;
    }
    const chunksXY = (canvas.size / TILE_SIZE);
    console.log('Copy Chunks to backup redis...');
    const startTime = Date.now();
    let amount = 0;
    for (let x = 0; x < chunksXY; x++) {
      for (let y = 0; y < chunksXY; y++) {
        const key = `ch:${id}:${x}:${y}`;
        let chunk = null;

        try {
          // eslint-disable-next-line no-await-in-loop
          chunk = await canvasRedis.get(
            commandOptions({ returnBuffers: true }),
            key,
          );
        } catch (error) {
          console.error(
            // eslint-disable-next-line max-len
            new Error(`Could not get chunk ${key} from redis: ${error.message}`),
          );
        }
        if (chunk) {
          try {
            // eslint-disable-next-line no-await-in-loop
            await backupRedis.set(key, chunk);
            amount += 1;
          } catch (error) {
            console.error(
              // eslint-disable-next-line max-len
              new Error(`Could not create chunk ${key} in backup-redis: ${error.message}`),
            );
          }
        }
      }
    }
    const time = Date.now() - startTime;
    console.log(`Finished Copying ${amount} chunks in ${time}ms.`);
  }
}


/*
 * Create incremential PNG tile backup between two redis canvases
 * @param canvasRedis redis from where to get the data
 * @param backupRedis redis where to write the data to
 * @param canvases Object with all canvas informations
 */
export async function incrementialBackupRedis(
  canvasRedis,
  backupRedis,
  canvases,
  backupDir,
) {
  const ids = Object.keys(canvases);
  for (let ind = 0; ind < ids.length; ind += 1) {
    const id = ids[ind];

    const canvas = canvases[id];
    if (canvas.v || canvas.hid) {
      // ignore 3D and hidden canvases
      continue;
    }

    const canvasBackupDir = `${backupDir}/${id}`;
    if (!fs.existsSync(canvasBackupDir)) {
      fs.mkdirSync(canvasBackupDir);
    }
    const date = new Date();
    let hours = date.getUTCHours();
    let minutes = date.getUTCMinutes();
    if (hours < 10) hours = `0${hours}`;
    if (minutes < 10) minutes = `0${minutes}`;
    const canvasTileBackupDir = `${canvasBackupDir}/${hours}${minutes}`;
    console.log(`Using folder ${canvasTileBackupDir}`);
    if (!fs.existsSync(canvasTileBackupDir)) {
      fs.mkdirSync(canvasTileBackupDir);
    }

    const palette = new Palette(canvas.colors);
    const chunksXY = (canvas.size / TILE_SIZE);
    console.log('Creating Incremential Backup...');
    const startTime = Date.now();
    let amount = 0;
    for (let x = 0; x < chunksXY; x++) {
      const xBackupDir = `${canvasTileBackupDir}/${x}`;
      let createdDir = false;

      for (let y = 0; y < chunksXY; y++) {
        const key = `ch:${id}:${x}:${y}`;

        let curChunk = null;
        try {
          // eslint-disable-next-line no-await-in-loop
          curChunk = await canvasRedis.get(
            commandOptions({ returnBuffers: true }),
            key,
          );
        } catch (error) {
          console.error(
            // eslint-disable-next-line max-len
            new Error(`Could not get chunk ${key} from redis: ${error.message}`),
          );
        }

        let oldChunk = null;
        try {
          // eslint-disable-next-line no-await-in-loop
          oldChunk = await backupRedis.get(
            commandOptions({ returnBuffers: true }),
            key,
          );
        } catch (error) {
          console.error(
            // eslint-disable-next-line max-len
            new Error(`Could not get chunk ${key} from backup-redis: ${error.message}`),
          );
        }

        let tileBuffer = null;

        try {
          if (!oldChunk && !curChunk) {
            continue;
          }
          if (!oldChunk) {
            oldChunk = Buffer.allocUnsafe(0);
          }
          if (!curChunk) {
            curChunk = Buffer.allocUnsafe(0);
          }

          const { abgr } = palette;
          const compLength = Math.min(oldChunk.length, curChunk.length);
          tileBuffer = new Uint32Array(TILE_SIZE ** 2);
          for (let i = 0; i < compLength; i += 1) {
            const curPxl = curChunk[i];
            if (oldChunk[i] !== curPxl) {
              tileBuffer[i] = abgr[curPxl & 0x3F];
            }
          }

          const oldChunkLength = oldChunk.length;
          const curChunkLength = curChunk.length;

          for (let i = oldChunkLength; i < curChunkLength; i += 1) {
            tileBuffer[i] = abgr[curChunk[i] & 0x3F];
          }

          if (oldChunkLength > curChunkLength) {
            const blank = abgr[0];
            for (let i = curChunkLength; i < oldChunkLength; i += 1) {
              if (oldChunk[i] !== 0) {
                tileBuffer[i] = blank;
              }
            }
          }
        } catch (error) {
          console.error(
            // eslint-disable-next-line max-len
            new Error(`Could not populate incremential backup data of chunk ${key}: ${error.message}`),
          );
          continue;
        }

        try {
          if (!createdDir && !fs.existsSync(xBackupDir)) {
            createdDir = true;
            fs.mkdirSync(xBackupDir);
          }
          const filename = `${xBackupDir}/${y}.png`;
          // eslint-disable-next-line no-await-in-loop
          await sharp(
            Buffer.from(tileBuffer.buffer), {
              raw: {
                width: TILE_SIZE,
                height: TILE_SIZE,
                channels: 4,
              },
            },
          ).toFile(filename);
          amount += 1;
        } catch (error) {
          console.error(
            // eslint-disable-next-line max-len
            new Error(`Could not save incremential backup of chunk ${key}: ${error.message}`),
          );
          continue;
        }
      }
    }
    const time = Date.now() - startTime;
    console.log(
      `Finished Incremential backup of ${amount} chunks in ${time}ms.`,
    );
  }
}


/*
 * Backup all tiles as PNG files into folder
 * @param redisClient RedisClient
 * @param canvases Object with the informations to all canvases
 * @param backupDir directory where to save png tiles
 */
export async function createPngBackup(
  redisClient,
  canvases,
  backupDir,
) {
  const ids = Object.keys(canvases);
  for (let ind = 0; ind < ids.length; ind += 1) {
    const id = ids[ind];

    const canvasBackupDir = `${backupDir}/${id}`;
    if (!fs.existsSync(canvasBackupDir)) {
      fs.mkdirSync(canvasBackupDir);
    }
    const canvasTileBackupDir = `${canvasBackupDir}/tiles`;
    if (!fs.existsSync(canvasTileBackupDir)) {
      fs.mkdirSync(canvasTileBackupDir);
    }

    const canvas = canvases[id];
    const palette = new Palette(canvas.colors);
    const chunksXY = (canvas.size / TILE_SIZE);
    console.log('Create PNG tiles from backup...');
    const startTime = Date.now();
    let amount = 0;
    for (let x = 0; x < chunksXY; x++) {
      const xBackupDir = `${canvasTileBackupDir}/${x}`;
      if (!fs.existsSync(xBackupDir)) {
        fs.mkdirSync(xBackupDir);
      }
      for (let y = 0; y < chunksXY; y++) {
        const key = `ch:${id}:${x}:${y}`;

        let chunk = null;
        try {
          // eslint-disable-next-line no-await-in-loop
          chunk = await redisClient.get(
            commandOptions({ returnBuffers: true }),
            key,
          );
        } catch (error) {
          console.error(
            // eslint-disable-next-line max-len
            new Error(`Could not get chunk ${key} from redis: ${error.message}`),
          );
        }
        if (chunk && chunk.length) {
          try {
            const tileBuffer = new Uint32Array(TILE_SIZE ** 2);
            const chunkLength = chunk.length;
            const { abgr } = palette;
            for (let i = 0; i < chunkLength; i += 1) {
              tileBuffer[i] = abgr[chunk[i] & 0x3F];
            }

            const filename = `${xBackupDir}/${y}.png`;

            // eslint-disable-next-line no-await-in-loop
            await sharp(
              Buffer.from(tileBuffer.buffer), {
                raw: {
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                  channels: 3,
                },
              },
            ).toFile(filename);
          } catch (error) {
            console.error(
              // eslint-disable-next-line max-len
              new Error(`Could not save daily backup of chunk ${key}: ${error.message}`),
            );
            continue;
          }
          amount += 1;
        }
      }
    }
    const time = Date.now() - startTime;
    console.log(
      `Finished creating PNG backup of ${amount} chunks in ${time}ms.`,
    );
  }
}
