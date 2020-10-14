import cornerstone from 'cornerstone-core';
import { import as csTools, getToolState } from 'cornerstone-tools';
import drawRect from './drawRect.js';

const BaseTool = csTools('base/BaseTool');
const drawTextBox = csTools('drawing/drawTextBox');
const getNewContext = csTools('drawing/getNewContext');

// console.log('bbox tool1');

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
    // console.log('bbox tool enabled ');
    this._forceImageUpdate();
  }

  disabledCallback() {
    // console.log('bbox tool disabled ');
    this._forceImageUpdate();
  }

  _forceImageUpdate() {
    // console.log('force bbox tool image update ');
    const enabledElement = cornerstone.getEnabledElement(this.element);
    const hasImageToUpdate = enabledElement.image;

    if (hasImageToUpdate) {
      cornerstone.updateImage(this.element, true);
    }
  }

  renderToolData(evt) {
    const eventData = evt.detail;

    // console.log('rtstruct ev data: ', eventData);
    const toolState = getToolState(evt.currentTarget, this.name);
    const { canvasContext, image } = eventData;
    const context = getNewContext(canvasContext.canvas);
    var element = eventData.element;

    // console.log('drawbbox toolstate, ', toolState);

    const modes = toolState.data[0]['data']['modes'];
    const img_type = toolState.data[0]['data']['img_desc'];

    // console.log('/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/');
    // console.log('modes: ', modes);
    // console.log('img_type: ', img_type);

    for (const user in toolState.data[0]['data']['shapes']) {
      // console.log(`user:${user}`);
      for (const task in toolState.data[0]['data']['shapes'][user]) {
        // console.log(`task:${task}`);
        for (const bbox in toolState.data[0]['data']['shapes'][user][task][
          'bboxes'
        ]) {
          // console.log(`bbox:${bbox}`);
          const alabel =
            toolState.data[0]['data']['shapes'][user][task]['bboxes'][bbox][
              'alabel'
            ];
          const plabel =
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
              color: 'rgb(255, 0, 0)',
            }
          );
        }
      }
    }

    // const textLines = [];
    // const color = toolColors.getToolColor();
    // Object.keys(stats).forEach(function(key) {
    //   const text = `${key} : ${stats[key]}`;
    //   textLines.push(text);
    // });
    // drawTextBox(context, textLines, 0, 0, color);
  }
}
