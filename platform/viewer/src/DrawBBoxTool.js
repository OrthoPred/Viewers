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

    console.log('rtstruct ev data: ', eventData);
    const toolState = getToolState(evt.currentTarget, this.name);

    console.log('drawbbox toolstate, ', toolState);
    console.log('evt.tgt, ', evt.currentTarget);
    console.log('toolstate, ', this.name);

    var element = eventData.element;
    const { canvasContext, image } = eventData;
    // const stats = image.stats;
    console.log('event data:', eventData);
    // console.log('image:', image);

    // var orthoFlowModule = cornerstone.metaData.get(
    //   'orthoFlowModule',
    //   image.imageId
    // );
    // console.log('orthoFlowModule', orthoFlowModule);
    // console.log('rows:', imagePixelModule.rows);

    // const textLines = [];
    const context = getNewContext(canvasContext.canvas);
    // const color = toolColors.getToolColor();

    // Object.keys(stats).forEach(function(key) {
    //   const text = `${key} : ${stats[key]}`;

    //   textLines.push(text);
    // });

    // drawTextBox(context, textLines, 0, 0, color);

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
        color: 'rgb(255, 0, 0)',
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
