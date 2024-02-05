/*
 * store for minimap / overlay templates
 *
 */

const initialState = {
  // prefix o: overlay, m: minimap
  ovEnabled: false,
  mEnabled: false,
  oOpacity: 40,
  oSmallPxls: true,
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

    case 's/REM_TEMPLATE': {
      return {
        ...state,
        list: state.list.filter((t) => t.title !== action.title),
      };
    }

    case 's/UPD_TEMPLATE_IMG': {
      const { imageId, width, height } = action;
      const { list } = state;
      const index = list.findIndex((t) => t.imageId === imageId);
      if (index === -1) {
        return state;
      }
      return {
        ...state,
        list: [
          ...list.slice(0, index),
          {
            ...list[index],
            imageId,
            width,
            height,
          },
          ...list.slice(index + 1),
        ],
      };
    }

    case 's/TGL_OVENABLED':
      return {
        ...state,
        ovEnabled: !state.ovEnabled,
      };

    case 's/TGL_SMALLPXLS':
      return {
        ...state,
        oSmallPxls: !state.oSmallPxls,
      };

    case 's/SET_O_OPACITY':
      return {
        ...state,
        oOpacity: action.opacity,
      };

    case 'TEMPLATES_READY':
      return {
        ...state,
        available: true,
      };

    case 'persist/REHYDRATE':
      return {
        ...state,
        available: false,
      };

    default:
      return state;
  }
}
