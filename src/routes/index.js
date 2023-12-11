/**
 *
 */

import express from 'express';
import etag from 'etag';
import path from 'path';

import ranking from './ranking';
import voidl from './void';
import history from './history';
import tiles from './tiles';
import chunks from './chunks';
import adminapi from './adminapi';
import captcha from './captcha';
import resetPassword from './reset_password';
import api from './api';

import { getJsAssets } from '../core/assets';
import { expressTTag } from '../core/ttag';
import corsMiddleware from '../utils/corsMiddleware';
import generateGlobePage from '../ssr/Globe';
import generatePopUpPage from '../ssr/PopUp';
import generateMainPage from '../ssr/Main';

import AVAILABLE_POPUPS from '../components/windows/popUpAvailable';
import { MONTH } from '../core/constants';
import { GUILDED_INVITE } from '../core/config';

const router = express.Router();

/*
 * Serving Chunks
 */
router.get(
  '/chunks/:c([0-9]+)/:x([0-9]+)/:y([0-9]+)(/)?:z([0-9]+)?.bmp',
  chunks,
);

/*
 * zoomed tiles
 */
router.use('/tiles', tiles);

/*
 * public folder
 * (this should be served with nginx or other webserver)
 */
router.use(express.static(path.join(__dirname, 'public'), {
  maxAge: 12 * MONTH,
  extensions: ['html'],
}));

/*
 * Redirect to guilded
 */
router.use('/guilded', (req, res) => {
  res.redirect(GUILDED_INVITE);
});

/*
 * adminapi
 */
router.use('/adminapi', adminapi);

/*
 * Following with translations
 * ---------------------------------------------------------------------------
 */
router.use(expressTTag);

//
// 3D Globe (react generated)
// -----------------------------------------------------------------------------
const globeEtag = etag(
  getJsAssets('globe').join('_'),
  { weak: true },
);
router.get('/globe', (req, res) => {
  res.set({
    'Cache-Control': `private, max-age=${15 * 60}`, // seconds
    ETag: globeEtag,
  });

  if (req.headers['if-none-match'] === globeEtag) {
    res.status(304).end();
    return;
  }

  res.set('Content-Type', 'text/html; charset=utf-8');

  res.status(200).send(generateGlobePage(req.lang));
});

//
// PopUps
// -----------------------------------------------------------------------------
const winEtag = etag(
  getJsAssets('popup').join('_'),
  { weak: true },
);

router.use(
  AVAILABLE_POPUPS.map((p) => `/${p.toLowerCase()}`),
  (req, res, next) => {
    if (req.method !== 'GET') {
      next();
      return;
    }

    res.set({
      'Cache-Control': `private, max-age=${15 * 60}`, // seconds
      ETag: winEtag,
    });

    if (req.headers['if-none-match'] === winEtag) {
      res.status(304).end();
      return;
    }

    res.set('Content-Type', 'text/html; charset=utf-8');

    res.status(200).send(generatePopUpPage(req));
  },
);

//
// Main Page
// -----------------------------------------------------------------------------
const indexEtag = etag(
  getJsAssets('client').join('_'),
  { weak: true },
);

router.get('/', (req, res) => {
  res.set({
    'Cache-Control': `private, max-age=${15 * 60}`, // seconds
    // ETag: indexEtag,
  });

  /*
   * TODO fix this per language
  if (req.headers['if-none-match'] === indexEtag) {
    res.status(304).end();
    return;
  }
  */

  const [html, csp] = generateMainPage(req);

  res.set({
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': csp,
  });

  res.status(200).send(html);
});


/*
 * Password Reset Link
 */
router.use('/reset_password', resetPassword);

/*
 * Following with CORS
 * ---------------------------------------------------------------------------
 */
router.use(corsMiddleware);

/*
 * API calls
 */
router.use('/api', api);

/*
 * void info
 */
router.get('/void', voidl);

/*
 * ranking of pixels placed
 * daily and total
 */
router.get('/ranking', ranking);

/*
 * give: date per query
 * returns: array of HHMM backups available
 */
router.get('/history', history);

/*
 * serve captcha
 */
router.get('/captcha.svg', captcha);


export default router;
