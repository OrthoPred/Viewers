import '../variables.css';
import '../theme-tide.css';
import './ViewerLocalFileData.css';
import '../OHIFStandaloneViewer.css'; // kell!!!

import React, { Component } from 'react';
import { metadata, utils } from '@ohif/core';
import ConnectedViewer from './ConnectedViewer.js';
import PropTypes from 'prop-types';
import { extensionManager } from './../App.js';
import Dropzone from 'react-dropzone';
import filesToStudies from '../lib/filesToStudies';

import { withTranslation } from 'react-i18next';

const { OHIFStudyMetadata } = metadata;
const { studyMetadataManager } = utils;

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
    studyMetadataManager.purge();
    studyMetadataManager.purge();

    // Map studies to new format, update metadata manager?
    const updatedStudies = studies.map(study => {
      const studyMetadata = new OHIFStudyMetadata(
        study,
        study.StudyInstanceUID
      );
      const sopClassHandlerModules =
        extensionManager.modules['sopClassHandlerModule'];

      study.displaySets =
        // study.displaySets ||
        studyMetadata.createDisplaySets(sopClassHandlerModules);
      studyMetadata.setDisplaySets(study.displaySets);

      studyMetadata.forEachDisplaySet(displayset => {
        displayset.localFile = true;
      });

      studyMetadataManager.add(studyMetadata);

      return study;
    });

    this.setState({
      studies: updatedStudies,
    });
  };

  render() {
    const onDrop = async acceptedFiles => {
      if (this.state.studies) {
        // this.setState({ studies: null, error: null });
        return;
      }
      if (acceptedFiles.length > 300) {
        acceptedFiles = acceptedFiles.slice(0, 300);
      }

      this.setState({ loading: true });

      cornerstoneWADOImageLoader.wadouri.fileManager.purge();
      const studies = await filesToStudies(acceptedFiles);
      // cornerstoneWADOImageLoader.wadouri.fileManager.purge(); !!!! a képeket nem memóriából tölti vissza, a fájlmanagernek tartalmaznia kell a fájl listát, minden betöltés után történt változás elvész az újrabetöltés miatt!!!

      const updatedStudies = this.updateStudies(studies);

      if (!updatedStudies) {
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
            {this.state.studies ? (
              <ConnectedViewer
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
                      <h3>
                        {this.props.t('Loading...')}
                      </h3> /* this.props.t: translation*/
                    ) : (
                        <>
                          <h3>
                            {this.props.t(
                              'Drag and Drop DICOM files here to load them in the Viewer'
                            )}
                          </h3>
                        </>
                      )}
                  </div>
                </div>
              )}
          </div>
        )}
      </Dropzone>
      // return (
      //   <Dropzone onDrop={onDrop} noClick>
      //     {({ getRootProps, getInputProps }) => (
      //       <div {...getRootProps()} style={{ width: '100%', height: '100%' }}>
      //         {this.state.studies ? (
      //           <ConnectedViewer
      //             studies={this.state.studies}
      //             studyInstanceUIDs={
      //               this.state.studies &&
      //               this.state.studies.map(a => a.StudyInstanceUID)
      //             }
      //           />
      //         ) : (
      //           <div className={'drag-drop-instructions'}>
      //             <div className={'drag-drop-contents'}>
      //               {this.state.loading ? (
      //                 <h3>{this.props.t('Loading...')}</h3>
      //               ) : (
      //                 <>
      //                   <h3>
      //                     {this.props.t(
      //                       'Drag and Drop DICOM files here to load them in the Viewer'
      //                     )}
      //                   </h3>
      //                   <h4>{linksDialogMessage(onDrop, this.props.t)}</h4>
      //                 </>
      //               )}
      //             </div>
      //           </div>
      //         )}
      //       </div>
      //     )}
      //   </Dropzone>
    );
  }
}

export default withTranslation('Common')(ViewerLocalFileData);
