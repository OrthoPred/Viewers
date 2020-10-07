import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import OHIF from '@ohif/core';
import ViewerMain from './ViewerMain';
import { connect } from 'react-redux';

const {
  setViewportSpecificData,
  clearViewportSpecificData,
} = OHIF.redux.actions;

const mapStateToProps = state => {
  const { activeViewportIndex, layout, viewportSpecificData } = state.viewports;

  return {
    activeViewportIndex,
    layout,
    viewportSpecificData,
    viewports: state.viewports,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setViewportSpecificData: (viewportIndex, data) => {
      dispatch(setViewportSpecificData(viewportIndex, data)); //Redux
    },
    clearViewportSpecificData: () => {
      dispatch(clearViewportSpecificData()); //Redux
    },
  };
};

const ViewerMain_ = connect(mapStateToProps, mapDispatchToProps)(ViewerMain);

import { withDialog } from '@ohif/ui';
import ToolbarRow from './ToolbarRow.js'; // toolbar, enélkül is működik
import ConnectedStudyBrowser from './ConnectedStudyBrowser.js'; //kell, ez a sidepanel!!
// import ConnectedViewerMain from './ConnectedViewerMain.js';
import SidePanel from './../components/SidePanel.js';
import ErrorBoundaryDialog from './../components/ErrorBoundaryDialog';

import './Viewer.css';

class Viewer extends Component {
  static propTypes = {
    studies: PropTypes.arrayOf(
      PropTypes.shape({
        StudyInstanceUID: PropTypes.string.isRequired,
        StudyDate: PropTypes.string,
        PatientID: PropTypes.string,
        displaySets: PropTypes.arrayOf(
          PropTypes.shape({
            displaySetInstanceUID: PropTypes.string.isRequired,
            SeriesDescription: PropTypes.string,
            SeriesNumber: PropTypes.number,
            InstanceNumber: PropTypes.number,
            numImageFrames: PropTypes.number,
            Modality: PropTypes.string.isRequired,
            images: PropTypes.arrayOf(
              PropTypes.shape({
                getImageId: PropTypes.func.isRequired,
              })
            ),
          })
        ),
      })
    ),
    studyInstanceUIDs: PropTypes.array,
    activeServer: PropTypes.shape({
      type: PropTypes.string,
      wadoRoot: PropTypes.string,
    }),
    onTimepointsUpdated: PropTypes.func,
    onMeasurementsUpdated: PropTypes.func,
    // window.store.getState().viewports.viewportSpecificData
    viewports: PropTypes.object, //.isRequired,
    // window.store.getState().viewports.activeViewportIndex
    activeViewportIndex: PropTypes.number, //.isRequired,
    isStudyLoaded: PropTypes.bool,
    dialog: PropTypes.object,
  };

  state = {
    isLeftSidePanelOpen: true,
    isRightSidePanelOpen: false,
    selectedRightSidePanel: '',
    selectedLeftSidePanel: 'studies', // TODO: Don't hardcode this
    thumbnails: [],
  };

  componentWillUnmount() {
    if (this.props.dialog) {
      this.props.dialog.dismissAll();
    }
  }

  componentDidMount() {
    const { studies, isStudyLoaded } = this.props;
    if (studies) {
      this.setState({
        thumbnails: _mapStudiesToThumbnails(studies),
      });
    }
    // var dlg = this.props.dialog.create({
    //   id: 'sff',
    //   content: ez,
    //   isDraggable: false,
    //   centralize: true,
    // });
    // console.log('dialog created,', dlg);
  }

  componentDidUpdate(prevProps) {
    // console.log('componentDidUpdate');

    const { studies, isStudyLoaded } = this.props;
    // console.log('Viewer_ studies', studies);
    if (studies !== prevProps.studies) {
      this.setState({
        thumbnails: _mapStudiesToThumbnails(studies),
      });
    }
    if (isStudyLoaded && isStudyLoaded !== prevProps.isStudyLoaded) {
      const PatientID = studies[0] && studies[0].PatientID;
    }
  }

  render() {
    return (
      <>
        <ErrorBoundaryDialog context="ToolbarRow">
          <ToolbarRow
            isLeftSidePanelOpen={this.state.isLeftSidePanelOpen}
            isRightSidePanelOpen={this.state.isRightSidePanelOpen}
            selectedLeftSidePanel={
              this.state.isLeftSidePanelOpen
                ? this.state.selectedLeftSidePanel
                : ''
            }
            selectedRightSidePanel={
              this.state.isRightSidePanelOpen
                ? this.state.selectedRightSidePanel
                : ''
            }
            handleSidePanelChange={(side, selectedPanel) => {
              const sideClicked = side && side[0].toUpperCase() + side.slice(1);
              const openKey = `is${sideClicked}SidePanelOpen`;
              const selectedKey = `selected${sideClicked}SidePanel`;
              const updatedState = Object.assign({}, this.state);

              const isOpen = updatedState[openKey];
              const prevSelectedPanel = updatedState[selectedKey];
              // RoundedButtonGroup returns `null` if selected button is clicked
              const isSameSelectedPanel =
                prevSelectedPanel === selectedPanel || selectedPanel === null;

              updatedState[selectedKey] = selectedPanel || prevSelectedPanel;

              const isClosedOrShouldClose = !isOpen || isSameSelectedPanel;
              if (isClosedOrShouldClose) {
                updatedState[openKey] = !updatedState[openKey];
              }

              this.setState(updatedState);
            }}
            studies={this.props.studies}
          />
        </ErrorBoundaryDialog>

        {/* VIEWPORTS + SIDEPANELS */}
        <div className="FlexboxLayout">
          {/* LEFT */}
          <ErrorBoundaryDialog context="LeftSidePanel">
            <SidePanel from="left" isOpen={this.state.isLeftSidePanelOpen}>
              <ConnectedStudyBrowser
                studies={this.state.thumbnails}
                studyMetadata={this.props.studies}
              />
            </SidePanel>
          </ErrorBoundaryDialog>

          {/* MAIN */}
          <div className={classNames('main-content')}>
            <ErrorBoundaryDialog context="ViewerMain">
              <ViewerMain_
                studies={this.props.studies}
                isStudyLoaded={this.props.isStudyLoaded}
              />
            </ErrorBoundaryDialog>
          </div>
        </div>
      </>
    );
  }
}

export default withDialog(Viewer);
// export default Viewer;

/**
 * What types are these? Why do we have "mapping" dropped in here instead of in
 * a mapping layer?
 *
 * TODO[react]:
 * - Add sorting of display sets
 * - Add showStackLoadingProgressBar option
 *
 * @param {Study[]} studies
 * @param {DisplaySet[]} studies[].displaySets
 */
const _mapStudiesToThumbnails = function(studies) {
  return studies.map(study => {
    const { StudyInstanceUID } = study;

    const thumbnails = study.displaySets.map(displaySet => {
      const {
        displaySetInstanceUID,
        SeriesDescription,
        SeriesNumber,
        InstanceNumber,
        numImageFrames,
      } = displaySet;

      let imageId;
      let altImageText;

      if (displaySet.images && displaySet.images.length) {
        const imageIndex = Math.floor(displaySet.images.length / 2);

        imageId = displaySet.images[imageIndex].getImageId();
      } else {
        altImageText = displaySet.Modality ? displaySet.Modality : 'UN';
      }

      return {
        imageId,
        altImageText,
        displaySetInstanceUID,
        SeriesDescription,
        SeriesNumber,
        InstanceNumber,
        numImageFrames,
      };
    });

    return {
      StudyInstanceUID,
      thumbnails,
    };
  });
};
