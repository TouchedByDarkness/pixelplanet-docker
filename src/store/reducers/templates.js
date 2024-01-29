/*
 * store for minimap / overlay templates
 *
 */

const initialState = {
  // prefix o: overlay, m: minimap
  ovEnabled: false,
  mEnabled: false,
  oOpacity: 1.0,
  oSmallPxls: false,
  /*
   * [{
   *   enabled,
   *   title,
   *   canvasId,
   *   x,
   *   y,
   *   imageId,
   *   width,
   *   height,
  *  },... ]
   */
  list: [],
};

export default function templates(
  state = initialState,
  action,
) {
  switch (action.type) {
    case 's/LIST_TEMPLATE': {
      const {
        imageId, title, canvasId, x, y, width, height,
      } = action;
      return {
        ...state,
        list: [
          ...state.list,
          {
            enabled: true,
            title,
            canvasId,
            x,
            y,
            imageId,
            width,
            height,
          },
        ],
      };
    }

    case 's/CHG_TEMPLATE': {
      const { title, props } = action;
      const { list } = state;
      const index = list.findIndex((t) => t.title === title);
      if (index === -1) {
        return state;
      }
      return {
        ...state,
        list: [
          ...list.slice(0, index),
          {
            ...list[index],
            ...props,
          },
          ...list.slice(index + 1),
        ],
      };
    }

    default:
      return state;
  }
}
