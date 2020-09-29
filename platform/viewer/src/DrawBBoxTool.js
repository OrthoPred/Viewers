import cornerstone from 'cornerstone-core';
import { import as csTools, toolColors } from 'cornerstone-tools';
import drawRect from './drawRect.js';

const BaseTool = csTools('base/BaseTool');
const drawTextBox = csTools('drawing/drawTextBox');
const getNewContext = csTools('drawing/getNewContext');

console.log('bbox tool1');

export default class DrawBBox extends BaseTool {
  constructor(configuration = {}) {
    const defaultConfig = {
      name: 'DrawBBox',
      mixins: ['enabledOrDisabledBinaryTool'],
    };
    const initialConfiguration = Object.assign(defaultConfig, configuration);

    super(initialConfiguration);

    this.initialConfiguration = initialConfiguration;
  }

  enabledCallback() {
    console.log('bbox tool enabled ');
    this._forceImageUpdate();
  }

  disabledCallback() {
    console.log('bbox tool disabled ');
    this._forceImageUpdate();
  }

  _forceImageUpdate() {
    console.log('force bbox tool image update ');
    const enabledElement = cornerstone.getEnabledElement(this.element);
    const hasImageToUpdate = enabledElement.image;

    if (hasImageToUpdate) {
      cornerstone.updateImage(this.element, true);
    }
  }

  renderToolData(evt) {
    // var color = _stateManagement_toolColors_js__WEBPACK_IMPORTED_MODULE_11__["default"].getColorIfActive({
    //   active: true
    // });
    // var context = Object(_drawing_index_j s__WEBPACK_IMPORTED_MODULE_8__["getNewContext"])(eventData.canvasContext.canvas);
    // Object(_drawing_inde  x_js__WEBPACK_IMPORTED_MODULE_8__["draw"])(context, function (context) {
    //   Object(_drawing_index_js__WE BPACK_IMPORTED_MODULE_8__["drawRect"])(context, element, _this2.handles.start, _this2.handles.end, {
    //     color: color
    //   });
    // });

    console.log('render bbox tool data');
    const eventData = evt.detail;
    var element = eventData.element;
    const { canvasContext, image } = eventData;
    const stats = image.stats;

    const textLines = [];
    const context = getNewContext(canvasContext.canvas);
    const color = toolColors.getToolColor();

    Object.keys(stats).forEach(function(key) {
      const text = `${key} : ${stats[key]}`;

      textLines.push(text);
    });

    drawTextBox(context, textLines, 0, 0, color);

    drawRect(
      context,
      element,
      {
        x: 135.74007220216606,
        y: 114.94584837545126,
        highlight: true,
        active: false,
      },
      {
        x: 300.74007220216606,
        y: 190.94584837545126,
        highlight: true,
        active: false,
      },
      {
        color: 'rgb(255, 255, 0)',
      }
    );
    drawRect(
      context,
      element,
      {
        x: 13.74007220216606,
        y: 11.94584837545126,
        highlight: true,
        active: false,
      },
      {
        x: 50.74007220216606,
        y: 30.94584837545126,
        highlight: true,
        active: false,
      },
      {
        color: 'rgb(255, 255, 0)',
      }
    );
  }
}
