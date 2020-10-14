import JSZip from 'jszip';
import React from 'react';
import PropTypes from 'prop-types';
import '../../../platform/viewer/src/progress/progress.css';
import { useTranslation } from 'react-i18next';
import isImportant from '@ohif/core/src/utils/isImportant';
// import setCornerstoneLayout from './utils/setCornerstoneLayout';
// import { useDispatch } from 'react-redux';

// import { servicesManager } from '../../../platform/viewer/src/App';
// console.log('imported svc mgr in dlform, ', servicesManager);
// // const { UIModalService } = servicesManager.services;

const REQUIRED_TAGS = [
  'Modality',
  'Manufacturer',
  'StudyDescription',
  'SeriesDescription',
  'ManufacturerModelName',
  'BodyPartExamined',
  'ScanningSequence',
  'SequenceVariant',
  'ScanOptions',
  'MRAcquisitionType',
  'SequenceName',
  'SliceThickness',
  'RepetitionTime',
  'EchoTime',
  'NumberOfAverages',
  'ImagingFrequency',
  'ImagedNucleus',
  'MagneticFieldStrength',
  'SpacingBetweenSlices',
  'ProtocolName',
  'PatientPosition',
  'StudyInstanceUID',
  'SeriesInstanceUID',
  'ImagePositionPatient',
  'ImageOrientationPatient',
  'FrameOfReferenceUID',
  'Laterality',
  'Rows',
  'Columns',
  'PixelSpacing',
  'BitsAllocated',
  'BitsStored',
  'HighBit',
  'SmallestImagePixelValue',
  'LargestImagePixelValue',
  'WindowCenter',
  'WindowWidth',
];

// var prgs = {};
var zipProgress = 0;
var uploadProgress = 0;

// const CornerstoneViewportDownloadForm = props => {
function CornerstoneViewportDownloadForm(props) {
  // console.log('upload');
  // console.log(props.studies);
  // console.log(props.progressData, props.progressId);
  let progress = 0;

  async function longPoll() {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.addEventListener('error', error => {
        console.log('An error occurred while retrieving the JSON data');
        reject(error);
      });

      xhr.addEventListener('timeout', error => {
        console.log('Timeout error');
        reject(error);
      });

      xhr.addEventListener('load', event => {
        if (event.target.status === 404) {
          reject(new Error('No JSON data found'));
        } else {
          if (!xhr.responseText) {
            console.log('Response was undefined');
            reject(new Error('Response was undefined'));
          } else {
            // console.log(JSON.stringify(xhr.responseText, null, 2));
            const data = JSON.parse(xhr.responseText);
            resolve(data);

            // let myGreeting = setTimeout(function() {
            //   resolve({ status: 'in progress', progress: progress });
            // }, 2000);
          }
        }
      });

      xhr.open('GET', '/api/longpoll'); // Setting the timeout after open because of IE11 issue: https://gitlab.com/meno/dropzone/issues/8
      xhr.timeout = 60000; // Has to be after `.open()`

      xhr.setRequestHeader('Accept', 'application/json');

      xhr.send();
    });
  }

  function poll() {
    console.log('running poll');
    longPoll().then(
      function(output) {
        console.log('long poll output: ', output);
        props.setInferenceProgress(output);
        if (output.progress != 'finished') {
          console.log('*****');
          console.log('rerun poll');

          poll();
        } else {
          console.log('polling finished');
          loadBBoxData(output);
        }
      },
      function(error) {
        console.log('reject in longPoll, ', error);
        props.onClose();
      }
    );
  }

  const globalImageIdSpecificToolStateManager =
    cornerstoneTools.globalImageIdSpecificToolStateManager;
  const toolState = globalImageIdSpecificToolStateManager.saveToolState();

  function loadBBoxData(bbox_data) {
    // console.log('load bbox data, ', bbox_data);

    for (const stuid in bbox_data.result) {
      // console.log(`stuid:${stuid}`);
      for (const seruid in bbox_data.result[stuid]) {
        // console.log(`seruid:${seruid}`);
        const imageIdSopInstanceUidPairs = _getImageIdSopInstanceUidPairsForDisplaySet(
          props.studies,
          stuid,
          seruid
        );
        for (const siuid in bbox_data.result[stuid][seruid]) {
          // console.log(`siuid:${siuid}`);
          const imageId = _getImageId(imageIdSopInstanceUidPairs, siuid);
          // console.log(siuid, imageId);
          const imageIdSpecificToolData = _getOrCreateImageIdSpecificToolData(
            toolState,
            imageId,
            'DrawBBox'
          );
          // console.log('push data');

          imageIdSpecificToolData.push({
            data: bbox_data.result[stuid][seruid][siuid],
          });
        }
      }
    }
  }

  const _getImageId = (imageIdSopInstanceUidPairs, sopInstanceUID) => {
    const imageIdSopInstanceUidPairsEntry = imageIdSopInstanceUidPairs.find(
      imageIdSopInstanceUidPairsEntry =>
        imageIdSopInstanceUidPairsEntry.sopInstanceUID === sopInstanceUID
    );

    return imageIdSopInstanceUidPairsEntry.imageId;
  };

  function _getOrCreateImageIdSpecificToolData(toolState, imageId, toolName) {
    if (toolState.hasOwnProperty(imageId) === false) {
      toolState[imageId] = {};
      // console.log('created idspecific tooldata: ', toolState);
    }

    const imageIdToolState = toolState[imageId];

    // If we don't have tool state for this type of tool, add an empty object
    if (imageIdToolState.hasOwnProperty(toolName) === false) {
      imageIdToolState[toolName] = {
        data: [],
      };
    }

    return imageIdToolState[toolName].data;
  }

  function _getImageIdSopInstanceUidPairsForDisplaySet(
    studies,
    StudyInstanceUID,
    SeriesInstanceUID
  ) {
    const study = studies.find(
      study => study.StudyInstanceUID === StudyInstanceUID
    );

    const displaySets = study.displaySets.filter(set => {
      return set.SeriesInstanceUID === SeriesInstanceUID;
    });

    if (displaySets.length > 1) {
      console.warn(
        'More than one display set with the same SeriesInstanceUID. This is not supported yet...'
      );
      // TODO -> We could make check the instance list and see if any match?
      // Do we split the segmentation into two cornerstoneTools segmentations if there are images in both series?
      // ^ Will that even happen?
    }

    const referencedDisplaySet = displaySets[0];

    return referencedDisplaySet.images.map(image => {
      return {
        imageId: image.getImageId(),
        sopInstanceUID: image.getSOPInstanceUID(),
      };
    });
  }

  const upload = studies => {
    // console.log('before zipAll');

    zipAll(studies).then(
      function(output) {
        //accept
        // console.log('after zipAll, before sendreq');
        sendRequest(output).then(
          function() {
            props.onClose();
            // console.log('modal service vége');
            poll();
          },
          function() {
            // console.log('reject in sendReq');
            props.onClose();
          }
        );
        // console.log('after sendreq');
      },
      function() {
        // console.log('reject in zipAll');
        props.onClose();
      }
    );
  };

  const [t] = useTranslation('ViewportDownloadForm');

  var zipAll = function() {
    var element = document.getElementById('myBar');
    return new Promise(function(resolve, reject) {
      var meta_tags = {};
      var foundImportant = false;

      const zip = new JSZip();
      props.studies.forEach(study => {
        // console.log('StudyInstanceUID:', study.StudyInstanceUID);
        study.series.forEach(serie => {
          // console.log('\tSeriesInstanceUID:', serie.SeriesInstanceUID);
          serie.instances.forEach(instance => {
            if (isImportant(instance.metadata)) {
              REQUIRED_TAGS.forEach(tag => {
                meta_tags[tag] = instance.metadata[tag];
              });

              var img_blob = new Blob([instance.metadata.PixelData], {
                type: 'application/dicom',
              });
              const img_path = `${study.StudyInstanceUID}/${serie.SeriesInstanceUID}/${instance.url}.dci`;
              zip.file(img_path.replace(':', '_'), img_blob);

              //Convert JSON Array to string.
              var json = JSON.stringify(meta_tags);
              //Convert JSON string to BLOB.
              json = [json];
              var tags_blob = new Blob(json, {
                type: 'text/plain;charset=utf-8',
              });

              const path = `${study.StudyInstanceUID}/${serie.SeriesInstanceUID}/${instance.url}.json`;
              zip.file(path.replace(':', '_'), tags_blob);
              foundImportant = true;
            }
          });
        });
      });

      if (foundImportant) {
        const blob = zip.generateAsync(
          { type: 'blob' },
          function updateCallback(metadata) {
            zipProgress = metadata.percent.toFixed(2);
            element.style.width = zipProgress + '%';
            // console.log('zip progress: ', zipProgress + ' %');
          }
        );
        resolve(blob);
      } else {
        // console.log('reject in zipAll');
        reject();
      }
      // const blob = zip.generateAsync({ type: 'blob' });
    });
  };

  // const downloadImage = () => {
  //   console.log('studies from vp dl form:', studies);
  //   downloadBlob(studies);
  // };

  var sendRequest = function(file) {
    var element = document.getElementById('myBar');
    return new Promise((resolve, reject) => {
      const req = new XMLHttpRequest();

      req.upload.addEventListener('progress', event => {
        if (event.lengthComputable) {
          // const copy = prgs;
          // copy[file.name] = {
          //   state: 'pending',
          //   percentage: (event.loaded / event.total) * 100,
          // };
          uploadProgress = (event.loaded / event.total) * 100;
          //  = metadata.percent.toFixed(2);
          element.style.width = uploadProgress + '%';
          // console.log('upload progress: ', uploadProgress + ' %');
        }
      });

      req.upload.addEventListener('load', event => {
        // const copy = prgs;
        // copy[file.name] = { state: 'done', percentage: 100 };
        // prgs = copy;
        // console.log('upload event listener load');
        resolve(req.response);
      });

      req.upload.addEventListener('error', event => {
        // const copy = prgs;
        // copy[file.name] = { state: 'error', percentage: 0 };
        // prgs = copy;
        // console.log('upload event listener error');
        reject(req.response);
      });

      const formData = new FormData();
      formData.append('file', file, file.name);

      req.open('POST', '/api/upload');
      req.send(formData);
    });
  };

  return (
    <div>
      <div className="ProgressWrapper" id="myBar">
        <div className="ProgressBar">
          <div className="Progress" style={{ width: 0 + '%' }} />
        </div>
      </div>

      <img
        className="CheckIcon"
        alt="done"
        src="baseline-check_circle_outline-24px.svg"
        style={{
          opacity: 0, //prgs && prgs.state === 'done' ? 0.5 : 0,
        }}
      />

      <div className="ViewportDownloadForm">
        <div className="actions">
          <div className="action-cancel">
            <button
              type="button"
              data-cy="cancel-btn"
              className="btn btn-danger"
              onClick={props.onClose}
            >
              {t('Buttons:Cancel')}
            </button>
          </div>
          <div className="action-save">
            <button
              // disabled={hasError}
              onClick={upload}
              className="btn btn-primary"
              data-cy="download-btn"
            >
              {t('Buttons:Upload')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

CornerstoneViewportDownloadForm.propTypes = {
  onClose: PropTypes.func,
  activeViewportIndex: PropTypes.number.isRequired,
};

export default CornerstoneViewportDownloadForm;

//**************

// async function longPoll() {
//   var xhr = new XMLHttpRequest(); // Put the xhr object in the file objects to be able to reference it later.
//   const url = 'url';
//   xhr.open('GET', url); // Setting the timeout after open because of IE11 issue: https://gitlab.com/meno/dropzone/issues/8
//   xhr.timeout = timeout; // Has to be after `.open()`

//   xhr.onload = function(e) {
//     this._finishedUploading(files, xhr, e);
//   };

//   xhr.ontimeout = function() {
//     console.log('timeout error');
//   };

//   xhr.onerror = function() {
//     console.log('xhr error');
//   };

//   xhr.setRequestHeader('Accept', 'application/json');

//   xhr.send();
// }

// const longPoll = () => {
//   console.log('start longPoll');
//   let progressData = 0;
//   let progressId = 0;
//   let timerId = setInterval(() => {
//     progressData += 20;
//     props.setInferenceProgress(progressId, progressData);
//   }, 1000);

//   setTimeout(() => {
//     clearInterval(timerId);
//     console.log('stop');
//   }, 20000);
//   /**
//    * Simple long polling client based on JQuery
//    */

/**
 * Request an update to the server and once it has answered, then update
 * the content and request again.
 * The server is supposed to response when a change has been made on data.
 */
//   function update() {
//     $.ajax({
//       url: '/data-update',
//       success: function(data) {
//         $('#dateChange').text(data.date);
//         $('#content').text(data.content);
//         update();
//       },
//       timeout: 500000, //If timeout is reached run again
//     });
//   }

//   /**
//    * Perform first data request. After taking this data, just query the
//    * server and refresh when answered (via update call).
//    */
//   function load() {
//     $.ajax({
//       url: '/data',
//       success: function(data) {
//         $('#content').text(data.content);
//         update();
//       },
//     });
//   }

//   $(document).ready(function() {
//     load();
//   });
// };
