/**
 *
 * @flow
 */

import React, { useState } from 'react';
import { GiPineTree } from 'react-icons/gi';

import SnowStorm from '../ui/snow';

const videoIds = [
  'cHtjXowWhVg', // last christmas
  'kLUKXX0sfII', // snowy
  'nhiNuN1OI6A', // cherry box
  'iTgcp1oDk2M', // red velvet vs. aespa
  'AZ2Oemlyuo4', // apink
  'o21QhCZZQJA', // weeekly
  'NtIHncxKSRM', // lightsum
  's4m6QM2mokI', // dont speak everglow
  'Gq7UubHYoag', // pinkfantasy
  '_6DyJqVYSaU', // hot issue
  '8A2t_tAjMz8', // knock knock twice
  'SIh8IwlDrMU', // TT live
  'w6gbPWJPXUI', // bopeep
];

const snowStorm = new SnowStorm(window, document);

const ChristmasButton = () => {
  const [playing, setPlaying] = useState(false);
  const prot = window.location.protocol;

  const video = videoIds[Math.floor(Math.random() * videoIds.length)];
  // eslint-disable-next-line no-console
  console.log('chose', video);
  const url = `${prot}//www.youtube.com/embed/${video}?autoplay=1&loop=1`;

  let style;
  if (playing) {
    style = {
      boxShadow: '0 0 9px 6px rgba(0, 189, 47, 0.8)',
      width: 'initial',
      height: 'initial',
      lineHeight: 0,
    };
  } else {
    style = {
      boxShadow: '0 0 9px 6px rgba(189, 0, 0, 0.8)',
    };
  }

  return (
    <div
      id="christmasbutton"
      className="actionbuttons"
      role="button"
      tabIndex={-1}
      onClick={() => {
        setPlaying(!playing);
        snowStorm.toggleSnow();
      }}
      style={style}
    >
      {(playing) ? <embed
          style={{ margin: 10 }}
          width="320"
          height="180"
          src={url}
        /> : <GiPineTree />}
    </div>
  );
};

export default ChristmasButton;
