// import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';

import '../OHIFStandaloneViewer.css';
import '../variables.css';
import '../theme-tide.css';
import { connect } from 'react-redux';
import Viewer from './Viewer.js';

import React, { Component } from 'react';
import { metadata, utils } from '@ohif/core';

//import ConnectedViewer from './ConnectedViewer.js';
import PropTypes from 'prop-types';
import { extensionManager } from './../App.js';
import Dropzone from 'react-dropzone';
import filesToStudies from '../lib/filesToStudies';
import './ViewerLocalFileData.css';
import { withTranslation } from 'react-i18next';

console.log('ez még ok');

const { OHIFStudyMetadata } = metadata;
const { studyMetadataManager } = utils;
const Viewer_ = connect()(Viewer);

const dropZoneLinkDialog = (onDrop, i18n, dir) => {
  return (
    <Dropzone onDrop={onDrop} noDrag>
      {({ getRootProps, getInputProps }) => (
        <span {...getRootProps()} className="link-dialog">
          {dir ? (
            <span>
              {i18n('Load folders')}
              <input
                {...getInputProps()}
                webkitdirectory="true"
                mozdirectory="true"
              />
            </span>
          ) : (
            <span>
              {i18n('Load files')}
              <input {...getInputProps()} />
            </span>
          )}
        </span>
      )}
    </Dropzone>
  );
};

const linksDialogMessage = (onDrop, i18n) => {
  return (
    <>
      {i18n('Or click to ')}
      {dropZoneLinkDialog(onDrop, i18n)}
      {i18n(' or ')}
      {dropZoneLinkDialog(onDrop, i18n, true)}
      {i18n(' from dialog')}
    </>
  );
};

class ViewerLocalFileData extends Component {
  static propTypes = {
    studies: PropTypes.array,
  };

  state = {
    studies: null,
    loading: false,
    error: null,
  };

  updateStudies = studies => {
    console.log('update studies');
    // Render the viewer when the data is ready
    studyMetadataManager.purge();

    // Map studies to new format, update metadata manager?
    const updatedStudies = studies.map(study => {
      //The map() method creates a new array populated with the results of calling a provided function on every element in the calling array.
      const studyMetadata = new OHIFStudyMetadata(
        study,
        study.StudyInstanceUID
      );
      const sopClassHandlerModules =
        extensionManager.modules['sopClassHandlerModule'];

      study.displaySets =
        study.displaySets ||
        studyMetadata.createDisplaySets(sopClassHandlerModules);
      studyMetadata.setDisplaySets(study.displaySets);

      // displayset = széria
      studyMetadata.forEachDisplaySet(displayset => {
        console.log('foreach display set', displayset);
        displayset.localFile = true;
      });

      studyMetadataManager.add(studyMetadata);

      console.log('study in updatestudies: ', study);
      return study;
    });

    console.log('most tölti be a store ba a studykat');
    this.setState({
      studies: updatedStudies,
    });
  };

  render() {
    const onDrop = async acceptedFiles => {
      console.log('setstate loading');
      this.setState({ loading: true });
      console.log('accepted files', acceptedFiles);

      cornerstoneWADOImageLoader.wadouri.fileManager.purge();
      const studies = await filesToStudies(acceptedFiles);
      console.log('flattened studies: ', studies);
      const updatedStudies = this.updateStudies(studies);

      console.log('before if updated');
      if (!updatedStudies) {
        console.log('inside if updated');
        return;
      }

      //redundáns, updatestudies-ban csinálja
      this.setState({ studies: updatedStudies, loading: false });
    };

    if (this.state.error) {
      return <div>Error: {JSON.stringify(this.state.error)}</div>;
    }

    return (
      <Dropzone onDrop={onDrop} noClick>
        {({ getRootProps, getInputProps }) => (
          <div {...getRootProps()} style={{ width: '100%', height: '100%' }}>
            {console.log('before state.studies')}

            {this.state.studies ? (
              <Viewer_
                studies={this.state.studies}
                studyInstanceUIDs={
                  this.state.studies &&
                  this.state.studies.map(a => a.StudyInstanceUID)
                }
              />
            ) : (
              <div className={'drag-drop-instructions'}>
                <div className={'drag-drop-contents'}>
                  {this.state.loading ? (
                    <h3>{this.props.t('Loading...')}</h3>
                  ) : (
                    <>
                      <h3>
                        {this.props.t(
                          'Drag and Drop DICOM files here to load them in the Viewer'
                        )}
                      </h3>
                      {/* <h4>{linksDialogMessage(onDrop, this.props.t)}</h4> */}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Dropzone>
    );
  }
}

export default withTranslation('Common')(ViewerLocalFileData);
