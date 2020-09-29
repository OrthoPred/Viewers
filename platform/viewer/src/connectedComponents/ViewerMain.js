import './ViewerMain.css';

import { Component } from 'react';
// import { ConnectedViewportGrid } from './../components/ViewportGrid/index.js';
// import ConnectedViewportGrid from './../components/ViewportGrid/ConnectedViewportGrid.js';
import PropTypes from 'prop-types';
import React from 'react';
import memoize from 'lodash/memoize';
// In comes memoization, a way for our function to remember (cache) the results.
// Memoization is an optimization technique used primarily to speed up computer programs
// by storing the results of expensive function calls and returning the cached result when the same inputs occur again
// Memoizing in simple terms means memorizing or storing in memory. A memoized function is
// usually faster because if the function is called subsequently with the previous value(s),
// then instead of executing the function, we would be fetching the result from the cache..
import _values from 'lodash/values';

import ViewportGrid from './../components/ViewportGrid/ViewportGrid.js';
import { MODULE_TYPES } from '@ohif/core';
import { connect } from 'react-redux';
import { extensionManager } from './../App.js';

const getAvailableViewportModules = memoize(viewportModules => {
  const availableViewportModules = {};
  viewportModules.forEach(moduleDefinition => {
    availableViewportModules[moduleDefinition.extensionId] =
      moduleDefinition.module;
  });
  return availableViewportModules;
});

const mapStateToProps = state => {
  const viewportModules = extensionManager.modules[MODULE_TYPES.VIEWPORT];
  const availableViewportModules = getAvailableViewportModules(viewportModules);

  // TODO: Use something like state.plugins.defaultPlugin[MODULE_TYPES.VIEWPORT]
  let defaultPlugin;
  if (viewportModules.length) {
    defaultPlugin = viewportModules[0].extensionId;
  }

  const { numRows, numColumns, layout, activeViewportIndex } = state.viewports;

  return {
    numRows,
    numColumns,
    layout,
    activeViewportIndex,
    // TODO: rename `availableViewportModules`
    availablePlugins: availableViewportModules,
    // TODO: rename `defaultViewportModule`
    defaultPlugin,
  };
};

const ConnectedViewportGrid = connect(mapStateToProps, null)(ViewportGrid);

var values = memoize(_values);

class ViewerMain extends Component {
  static propTypes = {
    activeViewportIndex: PropTypes.number.isRequired,
    studies: PropTypes.array,
    viewportSpecificData: PropTypes.object.isRequired,
    layout: PropTypes.object.isRequired,
    setViewportSpecificData: PropTypes.func.isRequired,
    clearViewportSpecificData: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      displaySets: [],
    };
  }

  getDisplaySets(studies) {
    const displaySets = [];
    studies.forEach(study => {
      study.displaySets.forEach(dSet => {
        if (!dSet.plugin) {
          dSet.plugin = 'cornerstone';
        }
        displaySets.push(dSet);
      });
    });

    return displaySets;
  }

  findDisplaySet(studies, StudyInstanceUID, displaySetInstanceUID) {
    const study = studies.find(study => {
      return study.StudyInstanceUID === StudyInstanceUID;
    });

    if (!study) {
      return;
    }

    return study.displaySets.find(displaySet => {
      return displaySet.displaySetInstanceUID === displaySetInstanceUID;
    });
  }

  componentDidMount() {
    // Add beforeUnload event handler to check for unsaved changes
    //window.addEventListener('beforeunload', unloadHandlers.beforeUnload);

    // Get all the display sets for the viewer studies
    if (this.props.studies) {
      // console.log('componentDidMount and there is study');
      const displaySets = this.getDisplaySets(this.props.studies);
      this.setState({ displaySets }, this.fillEmptyViewportPanes);
    }

    // else {
    // console.log('componentDidMount, no study');
    // }
    // console.log('props.studies= ', this.props.studies);
  }

  componentDidUpdate(prevProps) {
    console.log('viewermain comp didupdate', this.props.viewports);
    const prevViewportAmount = prevProps.layout.viewports.length;
    const viewportAmount = this.props.layout.viewports.length;
    // const isVtk = this.props.layout.viewports.some(vp => !!vp.vtk);

    // console.log('props.studies= ', this.props.studies);
    // console.log('prevProps.studies= ', prevProps.studies);

    if (
      this.props.studies !== prevProps.studies ||
      viewportAmount !== prevViewportAmount //&& !isVtk)
    ) {
      // console.log('componentDidUpdate study not equal');
      const displaySets = this.getDisplaySets(this.props.studies);
      this.setState({ displaySets }, this.fillEmptyViewportPanes);
    }
    // else {
    //   console.log('componentDidUpdate study equal');
    // }
  }

  fillEmptyViewportPanes = () => {
    // TODO: Here is the entry point for filling viewports on load.
    const dirtyViewportPanes = [];
    const { layout, viewportSpecificData } = this.props;
    const { displaySets } = this.state;

    if (!displaySets || !displaySets.length) {
      return;
    }

    for (let i = 0; i < layout.viewports.length; i++) {
      const viewportPane = viewportSpecificData[i];
      const isNonEmptyViewport =
        viewportPane &&
        viewportPane.StudyInstanceUID &&
        viewportPane.displaySetInstanceUID;

      if (isNonEmptyViewport) {
        dirtyViewportPanes.push({
          StudyInstanceUID: viewportPane.StudyInstanceUID,
          displaySetInstanceUID: viewportPane.displaySetInstanceUID,
        });

        continue;
      }

      const foundDisplaySet =
        displaySets.find(
          ds =>
            !dirtyViewportPanes.some(
              v => v.displaySetInstanceUID === ds.displaySetInstanceUID
            )
        ) || displaySets[displaySets.length - 1];

      dirtyViewportPanes.push(foundDisplaySet);
    }

    dirtyViewportPanes.forEach((vp, i) => {
      if (vp && vp.StudyInstanceUID) {
        this.setViewportData({
          viewportIndex: i,
          StudyInstanceUID: vp.StudyInstanceUID,
          displaySetInstanceUID: vp.displaySetInstanceUID,
        });
      }
    });
  };

  setViewportData = ({
    viewportIndex,
    StudyInstanceUID,
    displaySetInstanceUID,
  }) => {
    const displaySet = this.findDisplaySet(
      this.props.studies,
      StudyInstanceUID,
      displaySetInstanceUID
    );

    this.props.setViewportSpecificData(viewportIndex, displaySet);
    // console.log('viewer main setVPspecificdata:', viewportIndex, displaySet);
  };

  render() {
    // console.log('viewermain render');
    const { viewportSpecificData } = this.props;
    const viewportData = values(viewportSpecificData);
    // console.log('viewermain render after viewport');

    return (
      <div className="ViewerMain">
        {this.state.displaySets.length && (
          <ConnectedViewportGrid
            isStudyLoaded={this.props.isStudyLoaded}
            studies={this.props.studies}
            viewportData={viewportData}
            setViewportData={this.setViewportData}
          >
            {/* Children to add to each viewport that support children */}
          </ConnectedViewportGrid>
        )}
      </div>
    );
  }

  componentWillUnmount() {
    console.log('componentWillUnmount');
    // Clear the entire viewport specific data
    const { viewportSpecificData } = this.props;
    Object.keys(viewportSpecificData).forEach(viewportIndex => {
      this.props.clearViewportSpecificData(viewportIndex);
    });

    // TODO: These don't have to be viewer specific?
    // Could qualify for other routes?
    // hotkeys.destroy();

    // Remove beforeUnload event handler...
    // window.removeEventListener('beforeunload', unloadHandlers.beforeUnload);
    // Destroy the synchronizer used to update reference lines
    // viewer.updateImageSynchronizer.destroy();
    // TODO: Instruct all plugins to clean up themselves
    //
    // Clear references to all stacks in the StackManager
    // StackManager.clearStacks();
    // @TypeSafeStudies
    // Clears OHIF.viewer.Studies collection
    // viewer.Studies.removeAll();
    // @TypeSafeStudies
    // Clears OHIF.viewer.StudyMetadataList collection
    // viewer.StudyMetadataList.removeAll();
  }
}

export default ViewerMain;
