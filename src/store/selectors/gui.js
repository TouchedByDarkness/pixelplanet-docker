/*
 * selectors related to gui
 */

/* eslint-disable import/prefer-default-export */

export const selectIsDarkMode = (state) => (
  state.gui.style.indexOf('dark') !== -1
);

export const selectMovementControlProps = (state) => [
  state.canvas.is3D,
  state.gui.showMvmCtrls || (state.user.isOnMobile
    && (state.canvas.is3D || (state.gui.holdPaint > 0)
    && !state.canvas.isHistoricalView)),
];
