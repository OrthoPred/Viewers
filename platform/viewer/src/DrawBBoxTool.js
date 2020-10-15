import draw from './draw.js';
import fillBox from './fillBox.js';
import cornerstone from 'cornerstone-core';
import { import as csTools, getToolState } from 'cornerstone-tools';
import drawRect from './drawRect.js';

const BaseTool = csTools('base/BaseTool');
const getNewContext = csTools('drawing/getNewContext');
const defaultFontSize = 15;
const defaultFont = `${defaultFontSize}px Arial`;

const color_array = ['rgb(255,127,0)', 'rgb(0,127,255)', 'rgb(127,0,255)', 'rgb(127,255,0)', 'rgb(255,127,0)', 'rgb(255,0,127)',
  'rgb(0,0,255)', 'rgb(255,0,0)', 'rgb(0,255,0)', 'rgb(255,255,255)']

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
    this._forceImageUpdate();
  }

  disabledCallback() {
    this._forceImageUpdate();
  }

  _forceImageUpdate() {
    const enabledElement = cornerstone.getEnabledElement(this.element);
    const hasImageToUpdate = enabledElement.image;

    if (hasImageToUpdate) {
      cornerstone.updateImage(this.element, true);
    }
  }

  renderToolData(evt) {
    const eventData = evt.detail;
    const toolState = getToolState(evt.currentTarget, this.name);
    const { canvasContext, image } = eventData;
    const context = getNewContext(canvasContext.canvas);
    var element = eventData.element;

    const modes = toolState.data[0]['data']['modes'];
    const img_type = toolState.data[0]['data']['img_desc'];

    function generateColorByText(str) {

      var hash = 0;
      for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }


      var c = (hash & 0x00FFFFFF)
        .toString(16)
        .toUpperCase();

      return "#" + "00000".substring(0, 6 - c.length) + c;
    }

    const textLines = [];
    const haveIt = [];

    for (const user in toolState.data[0]['data']['shapes']) {
      // console.log(`user:${user}`);
      for (const task in toolState.data[0]['data']['shapes'][user]) {
        // console.log(`task:${task}`);
        for (const bbox in toolState.data[0]['data']['shapes'][user][task][
          'bboxes'
        ]) {
          // console.log(`bbox:${bbox}`);
          const alabel_key =
            toolState.data[0]['data']['shapes'][user][task]['bboxes'][bbox][
            'alabel'
            ];
          const plabel_key =
            toolState.data[0]['data']['shapes'][user][task]['bboxes'][bbox][
            'plabel'
            ];
          const tl =
            toolState.data[0]['data']['shapes'][user][task]['bboxes'][bbox][
            'tl'
            ];
          const br =
            toolState.data[0]['data']['shapes'][user][task]['bboxes'][bbox][
            'br'
            ];
          // console.log(`alabel:${alabel}, plabel:${plabel}, tl:${tl}, br:${br}`);

          // console.log("modes:", modes)
          const mode = alabel_key.split("/")[1].slice(1,)
          const alabel = modes[mode][parseInt(alabel_key[1])]


          // const generatedColor =  generateColorByText(alabel)
          const generatedColor = color_array[parseInt(alabel_key[1])]
          drawRect(
            context,
            element,
            {
              x: tl[0],
              y: tl[1],
              highlight: true,
              active: false,
            },
            {
              x: br[0],
              y: br[1],
              highlight: true,
              active: false,
            },
            {
              color: generatedColor,
            }
          );
          // console.log('textlines push ', alabel, generatedColor);
          if (!haveIt.includes(alabel)) {
            textLines.push([alabel, generatedColor]);
            haveIt.push(alabel)

          }
          // console.log("not includes:", !haveIt.includes(alabel))
        }
      }
    }

    // console.log('drawtextbox ');
    drawTextBox(context, textLines, 20, 45);


    /**
    * Compute the width of the box required to display the given `text` with a given `padding`.
    * @public
    * @function textBoxWidth
    * @memberof Drawing
    *
    * @param {CanvasRenderingContext2D} context - Target context
    * @param {String} text - The text to find the width of.
    * @param {Number} padding - The padding to apply on either end of the text.
    * @returns {Number} computed text box width
    */
    function textBoxWidth(context, text, padding) {
      const font = defaultFont
      const origFont = context.font;

      if (font && font !== origFont) {
        context.font = font;
      }
      const width = context.measureText(text).width;

      if (font && font !== origFont) {
        context.font = origFont;
      }

      return width + 2 * padding;
    }

    /**
     * Draws a textBox.
     * @public
     * @function drawTextBox
     * @memberof Drawing
     *
     * @param  {CanvasRenderingContext2D} context The canvas context.
     * @param  {string} textLines   The text to display.
     * @param  {number} x           The x position of the textBox.
     * @param  {number} y           The y position of the textBox.
     * @param  {string} color       The color of the textBox.
     * @param  {Object} options     Options for the textBox.
     * @returns {Object} {top, left, width, height} - Bounding box; can be used for pointNearTool
     */
    function drawTextBox(context, textLines, x, y, options) {

      const padding = 5;
      const fontSize = defaultFontSize;
      const backgroundColor = 'rgb(255, 255 ,255)';

      // Find the longest text width in the array of text data
      let maxWidth = 0;

      textLines.forEach(function (text) {
        // Get the text width in the current font
        const width = textBoxWidth(context, text[0], padding);

        // Find the maximum with for all the text rows;
        maxWidth = Math.max(maxWidth, width);
      });

      // Calculate the bounding box for this text box
      const boundingBox = {
        width: maxWidth,
        height: padding + textLines.length * (fontSize + padding),
      };

      draw(context, context => {
        // context.strokeStyle = 'rgb(255, 255 , 0)';

        // Draw the background box with padding
        if (options && options.centering && options.centering.x === true) {
          x -= boundingBox.width / 2;
        }

        if (options && options.centering && options.centering.y === true) {
          y -= boundingBox.height / 2;
        }

        boundingBox.left = x;
        boundingBox.top = y;

        const fillStyle = 'rgb(200, 200 , 200)';

        // options && options.debug === true ? '#FF0000' : backgroundColor;

        fillBox(context, boundingBox, fillStyle);

        // Draw each of the text lines on top of the background box
        fillTextLines(context, boundingBox, textLines, padding);
      });

      // Return the bounding box so it can be used for pointNearHandle
      return boundingBox;
    }

    /**
     * Draw multiple lines of text within a bounding box.
     * @public
     * @method fillTextLines
     * @memberof Drawing
     *
     * @param {CanvasRenderingContext2D} context - Target context
     * @param {Object} boundingBox - `{ left, top }` in canvas coordinates. Only the top-left corner is specified, as the text will take up as much space as it needs.
     * @param {String[]} textLines - The text to be displayed.
     * @param {FillStyle} fillStyle - The fillStyle to apply to the text.
     * @param {Number} padding - The amount of padding above/below each line in canvas units. Note this gives an inter-line spacing of `2*padding`.
     * @returns {undefined}
     */
    function fillTextLines(
      context,
      boundingBox,
      textLines,
      // fillStyle,
      padding
    ) {
      const fontSize = defaultFontSize;
      // console.log('filltextlines: ', textLines);

      context.font = defaultFont;
      context.textBaseline = 'top';
      textLines.forEach(function (text, index) {

        // console.log('text, color:', text[0], text[1]);
        context.fillStyle = text[1];
        context.fillText(
          text[0],
          boundingBox.left + padding,
          boundingBox.top + padding + index * (fontSize + padding)
        );

      });
    }
  }
}
