/**
 *
 * @flow
 */

import React, { useState } from 'react';
import { GiPineTree } from 'react-icons/gi';

import SnowStorm from '../ui/snow';

const videoIds = [
  'MU5jBhx0Tts',
  'cHtjXowWhVg',
  '0qK_E5C1Zi8',
  'cHtjXowWhVg',
  'kLUKXX0sfII',
  'nhiNuN1OI6A',
];

const snowStorm = new SnowStorm(window, document);

const ChristmasButton = () => {
  const [playing, setPlaying] = useState(false);
  const prot = window.location.protocol;

  const video = videoIds[Math.floor(Math.random() * videoIds.length)];
  const url = `${prot}//www.youtube.com/embed/${video}?autoplay=1&loop=1`;

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
      style={{
        boxShadow: (playing)
          ? '0 0 9px 6px rgba(0, 189, 47, 0.8)'
          : '0 0 9px 6px rgba(189, 0, 0, 0.8)',
      }}
    >
      <GiPineTree />
      {(playing) && (
        <embed
          height="0"
          width="0"
          src={url}
        />
      )}
    </div>
  );
};

export default ChristmasButton;
