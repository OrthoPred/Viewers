import OHIF from '@ohif/core';
import { SimpleDialog } from '@ohif/ui';
import cornerstone from 'cornerstone-core';
import csTools from 'cornerstone-tools';
import merge from 'lodash.merge';
import initCornerstoneTools from './initCornerstoneTools.js';
import DrawBBoxTool from '../../../platform/viewer/src/DrawBBoxTool';
import RTStructDisplayTool from '../../dicom-rt/src/tools/RTStructDisplayTool';

/**
 *
 * @param {Object} servicesManager
 * @param {Object} configuration
 * @param {Object|Array} configuration.csToolsConfig
 */

// console.log('init cornerstone  extension');

export default function init({ servicesManager, configuration }) {
  const { UIDialogService } = servicesManager.services;

  const callInputDialog = (data, event, callback) => {
    if (UIDialogService) {
      let dialogId = UIDialogService.create({
        centralize: true,
        isDraggable: false,
        content: SimpleDialog.InputDialog,
        useLastPosition: false,
        showOverlay: true,
        contentProps: {
          title: 'Enter your annotation',
          label: 'New label',
          measurementData: data ? { description: data.text } : {},
          onClose: () => UIDialogService.dismiss({ id: dialogId }),
          onSubmit: value => {
            callback(value);
            UIDialogService.dismiss({ id: dialogId });
          },
        },
      });
    }
  };

  const { csToolsConfig } = configuration;
  const metadataProvider = OHIF.cornerstone.metadataProvider;

  cornerstone.metaData.addProvider(
    metadataProvider.get.bind(metadataProvider),
    9999
  );

  // ~~
  const defaultCsToolsConfig = csToolsConfig || {
    globalToolSyncEnabled: true,
    showSVGCursors: true,
    autoResizeViewports: false,
  };

  initCornerstoneTools(defaultCsToolsConfig);

  const toolsGroupedByType = {
    //touch: [csTools.PanMultiTouchTool, csTools.ZoomTouchPinchTool],
    annotations: [
      csTools.ArrowAnnotateTool,
      csTools.BidirectionalTool,
      csTools.LengthTool,
      csTools.AngleTool,
      csTools.FreehandRoiTool,
      csTools.EllipticalRoiTool,
      csTools.DragProbeTool,
      csTools.RectangleRoiTool,
      // csTools.DrawBBoxTool,
    ],
    other: [
      csTools.PanTool,
      csTools.ZoomTool,
      csTools.WwwcTool,
      csTools.WwwcRegionTool,
      csTools.MagnifyTool,
      csTools.StackScrollTool,
      csTools.StackScrollMouseWheelTool,
      csTools.OverlayTool,
    ],
  };

  let tools = [];
  Object.keys(toolsGroupedByType).forEach(toolsGroup =>
    tools.push(...toolsGroupedByType[toolsGroup])
  );

  /* Add extension tools configuration here. */
  const internalToolsConfig = {
    ArrowAnnotate: {
      configuration: {
        getTextCallback: (callback, eventDetails) =>
          callInputDialog(null, eventDetails, callback),
        changeTextCallback: (data, eventDetails, callback) =>
          callInputDialog(data, eventDetails, callback),
      },
    },
  };

  /* Abstract tools configuration using extension configuration. */
  const parseToolProps = (props, tool) => {
    const { annotations } = toolsGroupedByType;
    // An alternative approach would be to remove the `drawHandlesOnHover` config
    // from the supported configuration properties in `cornerstone-tools`
    const toolsWithHideableHandles = annotations.filter(
      tool => !['RectangleRoiTool', 'EllipticalRoiTool'].includes(tool.name)
    );

    let parsedProps = { ...props };

    /**
     * drawHandles - Never/Always show handles
     * drawHandlesOnHover - Only show handles on handle hover (pointNearHandle)
     *
     * Does not apply to tools where handles aren't placed in predictable
     * locations.
     */
    if (
      configuration.hideHandles !== false &&
      toolsWithHideableHandles.includes(tool)
    ) {
      if (props.configuration) {
        parsedProps.configuration.drawHandlesOnHover = true;
      } else {
        parsedProps.configuration = { drawHandlesOnHover: true };
      }
    }

    return parsedProps;
  };

  /* Add tools with its custom props through extension configuration. */
  tools.forEach(tool => {
    const toolName = tool.name.replace('Tool', '');
    const externalToolsConfig = configuration.tools || {};
    const externalToolProps = externalToolsConfig[toolName] || {};
    const internalToolProps = internalToolsConfig[toolName] || {};
    const props = merge(
      internalToolProps,
      parseToolProps(externalToolProps, tool)
    );
    csTools.addTool(tool, props);
    csTools.addTool(tool, internalToolProps);
  });

  // TODO -> We need a better way to do this with maybe global tool state setting all tools passive.
  const BaseAnnotationTool = csTools.importInternal('base/BaseAnnotationTool');
  tools.forEach(tool => {
    if (tool.prototype instanceof BaseAnnotationTool) {
      // BaseAnnotationTool would likely come from csTools lib exports
      const toolName = new tool().name;
      csTools.setToolPassive(toolName); // there may be a better place to determine name; may not be on uninstantiated class
    }
  });

  csTools.setToolActive('Pan', { mouseButtonMask: 3 });
  csTools.setToolActive('Zoom', { mouseButtonMask: 2 });
  csTools.setToolActive('Wwwc', { mouseButtonMask: 1 });
  csTools.setToolActive('StackScrollMouseWheel', {}); // TODO: Empty options should not be required
  csTools.setToolActive('PanMultiTouch', { pointers: 2 }); // TODO: Better error if no options
  csTools.setToolActive('ZoomTouchPinch', {});
  csTools.setToolEnabled('Overlay', {});

  // csTools.addTool(RTStructDisplayTool);
  // csTools.setToolEnabled('RTStruct');

  csTools.addTool(DrawBBoxTool);
  csTools.setToolEnabled('DrawBBox');
  console.log('tool store: ', csTools.store);
}
