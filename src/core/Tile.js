/*
 * basic functions for creating zommed tiles
 * Used by tilewriter worker thread, so dont import too much.
 *
 * */

/* eslint-disable no-console */

// Tile creation is allowed to be slow
/* eslint-disable no-await-in-loop */

import sharp from 'sharp';
import fs from 'fs';

import Palette from './Palette';
import { getMaxTiledZoom } from './utils';
import { TILE_SIZE, TILE_ZOOM_LEVEL } from './constants';

/*
 * Deletes a subtile from a tile (paints it in color 0),
 * if we wouldn't do it, it would be black
 * @param palette Palette to use
 * @param subtilesInTile how many subtiles are in a tile (per dimension)
 * @param cell subtile to delete [dx, dy]
 * @param buffer Uint8Array for RGB values of tile
 */
function deleteSubtilefromTile(
  palette,
  subtilesInTile,
  cell,
  buffer: Uint8Array,
) {
  const [dx, dy] = cell;
  const offset = (dx + dy * TILE_SIZE * subtilesInTile) * TILE_SIZE;
  for (let row = 0; row < TILE_SIZE; row += 1) {
    let channelOffset = (offset + row * TILE_SIZE * subtilesInTile) * 3;
    const max = channelOffset + TILE_SIZE * 3;
    while (channelOffset < max) {
      // eslint-disable-next-line prefer-destructuring
      buffer[channelOffset++] = palette.rgb[0];
      // eslint-disable-next-line prefer-destructuring
      buffer[channelOffset++] = palette.rgb[1];
      // eslint-disable-next-line prefer-destructuring
      buffer[channelOffset++] = palette.rgb[2];
    }
  }
}

/*
 * @param subtilesInTile how many subtiles are in a tile (per dimension)
 * @param cell subtile to delete [dx, dy]
 * @param subtile RGB buffer of subtile
 * @param buffer Uint8Array for RGB values of tile
 */
function addRGBSubtiletoTile(
  subtilesInTile,
  cell,
  subtile: Buffer,
  buffer: Uint8Array,
) {
  const [dx, dy] = cell;
  const chunkOffset = (dx + dy * subtilesInTile * TILE_SIZE) * TILE_SIZE;
  let pos = 0;
  for (let row = 0; row < TILE_SIZE; row += 1) {
    let channelOffset = (chunkOffset + row * TILE_SIZE * subtilesInTile) * 3;
    const max = channelOffset + TILE_SIZE * 3;
    while (channelOffset < max) {
      buffer[channelOffset++] = subtile[pos++];
      buffer[channelOffset++] = subtile[pos++];
      buffer[channelOffset++] = subtile[pos++];
    }
  }
}

/*
 * @param palette Palette to use
 * @param subtilesInTile how many subtiles are in a tile (per dimension)
 * @param cell subtile to delete [dx, dy]
 * @param subtile RGB buffer of subtile
 * @param buffer RGB Buffer of tile
 */
function addIndexedSubtiletoTile(
  palette,
  subtilesInTile,
  cell,
  subtile: Buffer,
  buffer: Uint8Array,
) {
  const [dx, dy] = cell;
  const chunkOffset = (dx + dy * subtilesInTile * TILE_SIZE) * TILE_SIZE;
  let pos = 0;
  let clr;
  for (let row = 0; row < TILE_SIZE; row += 1) {
    let channelOffset = (chunkOffset + row * TILE_SIZE * subtilesInTile) * 3;
    const max = channelOffset + TILE_SIZE * 3;
    while (channelOffset < max) {
      clr = (subtile[pos++] & 0x3F) * 3;
      buffer[channelOffset++] = palette.rgb[clr++];
      buffer[channelOffset++] = palette.rgb[clr++];
      buffer[channelOffset++] = palette.rgb[clr];
    }
  }
}

/*
 * @param canvasTileFolder root folder where to save tiles
 * @param cell tile [z, x, y]
 * @return filename of tile
 */
function tileFileName(canvasTileFolder, cell) {
  const [z, x, y] = cell;
  const filename = `${canvasTileFolder}/${z}/${x}/${y}.png`;
  return filename;
}

/*
 * @param redisClient redis instance
 * @param canvasId id of the canvas
 * @param canvas canvas data
 * @param canvasTileFolder root folder where to save tiles
 * @param cell tile to create [x, y]
 * @return true if successfully created tile, false if tile empty
 */
export async function createZoomTileFromChunk(
  redisClient,
  canvasId,
  canvas,
  canvasTileFolder,
  cell,
) {
  const palette = new Palette(canvas.colors);
  const canvasSize = canvas.size;
  const [x, y] = cell;
  const maxTiledZoom = getMaxTiledZoom(canvasSize);
  const tileRGBBuffer = new Uint8Array(
    TILE_SIZE * TILE_SIZE * TILE_ZOOM_LEVEL * TILE_ZOOM_LEVEL * 3,
  );
  const startTime = Date.now();

  const xabs = x * TILE_ZOOM_LEVEL;
  const yabs = y * TILE_ZOOM_LEVEL;
  const na = [];
  let chunk = null;
  for (let dy = 0; dy < TILE_ZOOM_LEVEL; dy += 1) {
    for (let dx = 0; dx < TILE_ZOOM_LEVEL; dx += 1) {
      chunk = await redisClient.getAsync(
        `ch:${canvasId}:${xabs + dx}:${yabs + dy}`,
      );
      if (!chunk || chunk.length !== TILE_SIZE * TILE_SIZE) {
        na.push([dx, dy]);
        continue;
      }
      addIndexedSubtiletoTile(
        palette,
        TILE_ZOOM_LEVEL,
        [dx, dy],
        chunk,
        tileRGBBuffer,
      );
    }
  }
  chunk = null;

  if (na.length !== TILE_ZOOM_LEVEL * TILE_ZOOM_LEVEL) {
    na.forEach((element) => {
      deleteSubtilefromTile(palette, TILE_ZOOM_LEVEL, element, tileRGBBuffer);
    });

    const filename = tileFileName(canvasTileFolder, [maxTiledZoom - 1, x, y]);
    try {
      await sharp(Buffer.from(tileRGBBuffer.buffer), {
        raw: {
          width: TILE_SIZE * TILE_ZOOM_LEVEL,
          height: TILE_SIZE * TILE_ZOOM_LEVEL,
          channels: 3,
        },
      })
        .resize(TILE_SIZE)
        .png({ options: { compressionLevel: 6 } })
        .toFile(filename);
    } catch (error) {
      console.error(
        `Tiling: Error on createZoomTileFromChunk:\n${error.message}`,
      );
      return false;
    }
    console.log(
      // eslint-disable-next-line max-len
      `Tiling: Created Tile ${filename} with ${na.length} empty chunks in ${Date.now() - startTime}ms`,
    );
    return true;
  }
  return false;
}

/*
 * @param canvas canvas data
 * @param canvasTileFolder root folder where to save tiles
 * @param cell tile to create [z, x, y]
 * @return trie if successfully created tile, false if tile empty
 */
export async function createZoomedTile(
  canvas,
  canvasTileFolder,
  cell,
) {
  const palette = new Palette(canvas.colors);
  const tileRGBBuffer = new Uint8Array(
    TILE_SIZE * TILE_SIZE * TILE_ZOOM_LEVEL * TILE_ZOOM_LEVEL * 3,
  );
  const [z, x, y] = cell;

  const startTime = Date.now();
  const na = [];
  for (let dy = 0; dy < TILE_ZOOM_LEVEL; dy += 1) {
    for (let dx = 0; dx < TILE_ZOOM_LEVEL; dx += 1) {
      // eslint-disable-next-line max-len
      const chunkfile = `${canvasTileFolder}/${z + 1}/${x * TILE_ZOOM_LEVEL + dx}/${y * TILE_ZOOM_LEVEL + dy}.png`;
      if (!fs.existsSync(chunkfile)) {
        na.push([dx, dy]);
        continue;
      }
      try {
        const chunk = await sharp(chunkfile).removeAlpha().raw().toBuffer();
        addRGBSubtiletoTile(TILE_ZOOM_LEVEL, [dx, dy], chunk, tileRGBBuffer);
      } catch (error) {
        console.error(
          // eslint-disable-next-line max-len
          `Tiling: Error on createZoomedTile on chunk ${chunkfile}:\n${error.message}`,
        );
      }
    }
  }

  if (na.length !== TILE_ZOOM_LEVEL * TILE_ZOOM_LEVEL) {
    na.forEach((element) => {
      deleteSubtilefromTile(palette, TILE_ZOOM_LEVEL, element, tileRGBBuffer);
    });

    const filename = tileFileName(canvasTileFolder, [z, x, y]);
    try {
      await sharp(
        Buffer.from(
          tileRGBBuffer.buffer,
        ), {
          raw: {
            width: TILE_SIZE * TILE_ZOOM_LEVEL,
            height: TILE_SIZE * TILE_ZOOM_LEVEL,
            channels: 3,
          },
        },
      ).resize(TILE_SIZE).toFile(filename);
    } catch (error) {
      console.error(
        `Tiling: Error on createZoomedTile:\n${error.message}`,
      );
      return false;
    }
    console.log(
      // eslint-disable-next-line max-len
      `Tiling: Created tile ${filename} with ${na.length} empty subtiles in ${Date.now() - startTime}ms.`,
    );
    return true;
  }
  return false;
}

/*
 * create an empty image tile with just one color
 * @param canvasTileFolder root folder where to save texture
 * @param palette Palette to use
 */
async function createEmptyTile(
  canvasTileFolder,
  palette,
) {
  const tileRGBBuffer = new Uint8Array(
    TILE_SIZE * TILE_SIZE * 3,
  );
  let i = 0;
  const max = TILE_SIZE * TILE_SIZE * 3;
  while (i < max) {
    // eslint-disable-next-line prefer-destructuring
    tileRGBBuffer[i++] = palette.rgb[0];
    // eslint-disable-next-line prefer-destructuring
    tileRGBBuffer[i++] = palette.rgb[1];
    // eslint-disable-next-line prefer-destructuring
    tileRGBBuffer[i++] = palette.rgb[2];
  }
  const filename = `${canvasTileFolder}/emptytile.png`;
  try {
    await sharp(Buffer.from(tileRGBBuffer.buffer), {
      raw: {
        width: TILE_SIZE,
        height: TILE_SIZE,
        channels: 3,
      },
    })
      .png({ options: { compressionLevel: 6 } })
      .toFile(filename);
  } catch (error) {
    console.error(
      `Tiling: Error on createEmptyTile:\n${error.message}`,
    );
    return;
  }
  console.log(`Tiling: Created empty tile at ${filename}`);
}

/*
 * created 4096x4096 texture of default canvas
 * @param redisClient redis instance
 * @param canvasId numberical Id of canvas
 * @param canvas canvas data
 * @param canvasTileFolder root folder where to save texture
 *
 */
export async function createTexture(
  redisClient,
  canvasId,
  canvas,
  canvasTileFolder,
) {
  const palette = new Palette(canvas.colors);
  const canvasSize = canvas.size;
  // dont create textures larger than 4096
  const targetSize = Math.min(canvasSize, 4096);
  const amount = targetSize / TILE_SIZE;
  const zoom = Math.log2(amount) / 2;
  const textureBuffer = new Uint8Array(targetSize * targetSize * 3);
  const startTime = Date.now();

  const na = [];
  let chunk = null;
  if (targetSize !== canvasSize) {
    for (let dy = 0; dy < amount; dy += 1) {
      for (let dx = 0; dx < amount; dx += 1) {
        const chunkfile = `${canvasTileFolder}/${zoom}/${dx}/${dy}.png`;
        if (!fs.existsSync(chunkfile)) {
          na.push([dx, dy]);
          continue;
        }
        try {
          chunk = await sharp(chunkfile).removeAlpha().raw().toBuffer();
          addRGBSubtiletoTile(amount, [dx, dy], chunk, textureBuffer);
        } catch (error) {
          console.error(
            // eslint-disable-next-line max-len
            `Tiling: Error on createTexture in chunk ${chunkfile}:\n${error.message}`,
          );
        }
      }
    }
  } else {
    for (let dy = 0; dy < amount; dy += 1) {
      for (let dx = 0; dx < amount; dx += 1) {
        chunk = await redisClient.getAsync(`ch:${canvasId}:${dx}:${dy}`);
        if (!chunk || chunk.length !== TILE_SIZE * TILE_SIZE) {
          na.push([dx, dy]);
          continue;
        }
        addIndexedSubtiletoTile(
          palette,
          amount,
          [dx, dy],
          chunk,
          textureBuffer,
        );
      }
    }
  }
  chunk = null;

  na.forEach((element) => {
    deleteSubtilefromTile(palette, amount, element, textureBuffer);
  });

  const filename = `${canvasTileFolder}/texture.png`;
  try {
    await sharp(
      Buffer.from(textureBuffer.buffer), {
        raw: {
          width: targetSize,
          height: targetSize,
          channels: 3,
        },
      },
    ).toFile(filename);
  } catch (error) {
    console.error(
      `Tiling: Error on createTexture:\n${error.message}`,
    );
    return;
  }
  console.log(
    `Tiling: Created texture in ${(Date.now() - startTime) / 1000}s.`,
  );
}

/*
 * Create all tiles
 * @param redisClient redis instance
 * @param canvasId id of the canvas
 * @param canvas canvas data
 * @param canvasTileFolder folder for tiles
 * @param force overwrite existing tiles
 */
export async function initializeTiles(
  redisClient,
  canvasId,
  canvas,
  canvasTileFolder,
  force = false,
) {
  console.log(
    `Tiling: Initializing tiles in ${canvasTileFolder}, forceint = ${force}`,
  );
  const startTime = Date.now();
  const palette = new Palette(canvas.colors);
  const canvasSize = canvas.size;
  const maxTiledZoom = getMaxTiledZoom(canvasSize);
  // empty tile
  await createEmptyTile(canvasTileFolder, palette);
  // base zoomlevel
  let zoom = maxTiledZoom - 1;
  let zoomDir = `${canvasTileFolder}/${zoom}`;
  console.log(`Tiling: Checking zoomlevel ${zoomDir}`);
  if (!fs.existsSync(zoomDir)) fs.mkdirSync(zoomDir);
  let cnt = 0;
  let cnts = 0;
  const maxBase = TILE_ZOOM_LEVEL ** zoom;
  for (let cx = 0; cx < maxBase; cx += 1) {
    const tileDir = `${canvasTileFolder}/${zoom}/${cx}`;
    if (!fs.existsSync(tileDir)) fs.mkdirSync(tileDir);
    for (let cy = 0; cy < maxBase; cy += 1) {
      const filename = `${canvasTileFolder}/${zoom}/${cx}/${cy}.png`;
      if (force || !fs.existsSync(filename)) {
        const ret = await createZoomTileFromChunk(
          redisClient,
          canvasSize,
          canvasId,
          canvasTileFolder,
          palette,
          [cx, cy],
        );
        if (ret) cnts += 1;
        cnt += 1;
      }
    }
  }
  console.log(
    `Tiling: Created ${cnts} / ${cnt} tiles for basezoom of canvas${canvasId}`,
  );
  // zoomlevels that are created from other zoomlevels
  for (zoom = maxTiledZoom - 2; zoom >= 0; zoom -= 1) {
    cnt = 0;
    cnts = 0;
    zoomDir = `${canvasTileFolder}/${zoom}`;
    console.log(`Tiling: Checking zoomlevel ${zoomDir}`);
    if (!fs.existsSync(zoomDir)) fs.mkdirSync(zoomDir);
    const maxZ = TILE_ZOOM_LEVEL ** zoom;
    for (let cx = 0; cx < maxZ; cx += 1) {
      const tileDir = `${canvasTileFolder}/${zoom}/${cx}`;
      if (!fs.existsSync(tileDir)) fs.mkdirSync(tileDir);
      for (let cy = 0; cy < maxZ; cy += 1) {
        const filename = `${canvasTileFolder}/${zoom}/${cx}/${cy}.png`;
        if (force || !fs.existsSync(filename)) {
          const ret = await createZoomedTile(
            canvasTileFolder,
            palette,
            [zoom, cx, cy],
          );
          if (ret) cnts += 1;
          cnt += 1;
        }
      }
    }
    console.log(
      // eslint-disable-next-line max-len
      `Tiling: Created ${cnts} / ${cnt} tiles for zoom ${zoom} for canvas${canvasId}`,
    );
  }
  // create snapshot texture
  await createTexture(
    redisClient,
    canvasId,
    canvas,
    canvasTileFolder,
  );
  //--
  console.log(
    // eslint-disable-next-line max-len
    `Tiling: Elapsed Time: ${Math.round((Date.now() - startTime) / 1000)} for canvas${canvasId}`,
  );
}
