import JSZip from 'jszip';
import React from 'react';
import PropTypes from 'prop-types';
import '../../../platform/viewer/src/progress/progress.css';
import { useTranslation } from 'react-i18next';
import isImportant from '@ohif/core/src/utils/isImportant';
import setCornerstoneLayout from './utils/setCornerstoneLayout';
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
  console.log('upload');
  console.log(props.studies);
  console.log(props.progressData, props.progressId);

  const longPoll = () => {
    console.log('start longPoll');
    let progressData = 0;
    let progressId = 0;
    let timerId = setInterval(() => {
      progressData += 20;
      props.setInferenceProgress(progressId, progressData);
    }, 1000);

    setTimeout(() => {
      clearInterval(timerId);
      console.log('stop');
    }, 20000);
    /**
     * Simple long polling client based on JQuery
     */

    /**
     * Request an update to the server and once it has answered, then update
     * the content and request again.
     * The server is supposed to response when a change has been made on data.
     */
    function update() {
      $.ajax({
        url: '/data-update',
        success: function(data) {
          $('#dateChange').text(data.date);
          $('#content').text(data.content);
          update();
        },
        timeout: 500000, //If timeout is reached run again
      });
    }

    /**
     * Perform first data request. After taking this data, just query the
     * server and refresh when answered (via update call).
     */
    function load() {
      $.ajax({
        url: '/data',
        success: function(data) {
          $('#content').text(data.content);
          update();
        },
      });
    }

    $(document).ready(function() {
      load();
    });
  };

  const upload = studies => {
    console.log('before zipAll');

    zipAll(studies).then(
      function(output) {
        //accept
        console.log('after zipAll, before sendreq');
        sendRequest(output).then(
          function() {
            props.onClose();
            console.log('modal service vége');
            longPoll();
          },
          function() {
            console.log('reject in sendReq');
            props.onClose();
          }
        );
        console.log('after sendreq');
      },
      function() {
        console.log('reject in zipAll');
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
        console.log('reject in zipAll');
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
          console.log('upload progress: ', uploadProgress + ' %');
        }
      });

      req.upload.addEventListener('load', event => {
        // const copy = prgs;
        // copy[file.name] = { state: 'done', percentage: 100 };
        // prgs = copy;
        console.log('upload event listener load');
        resolve(req.response);
      });

      req.upload.addEventListener('error', event => {
        // const copy = prgs;
        // copy[file.name] = { state: 'error', percentage: 0 };
        // prgs = copy;
        console.log('upload event listener error');
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

//********************

function xhrLoad(url, onload, onerror) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'arraybuffer';
  xhr.onload = function xhr_onload() {
    if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) {
      onload(xhr.response);
    } else {
      onerror();
    }
  };
  xhr.onerror = onerror;
  xhr.send(null);
}

function asyncLoad(url, onload, onerror) {
  xhrLoad(
    url,
    function(arrayBuffer) {
      assert(
        arrayBuffer,
        'Loading data file "' + url + '" failed (no arrayBuffer).'
      );
      onload(new Uint8Array(arrayBuffer));
    },
    function(event) {
      if (onerror) {
        onerror();
      } else {
        throw 'Loading data file "' + url + '" failed.';
      }
    }
  );
}

//**************

function _uploadData(files, dataBlocks) {
  var xhr = new XMLHttpRequest(); // Put the xhr object in the file objects to be able to reference it later.

  file.xhr = xhr;

  var method = this.resolveOption(this.options.method, files);
  var url = this.resolveOption(this.options.url, files);

  xhr.open(method, url, true); // Setting the timeout after open because of IE11 issue: https://gitlab.com/meno/dropzone/issues/8
  xhr.timeout = this.resolveOption(this.options.timeout, files); // Has to be after `.open()`. See https://github.com/enyo/dropzone/issues/179

  xhr.withCredentials = !!this.options.withCredentials;

  xhr.onload = function(e) {
    this._finishedUploading(files, xhr, e);
  };

  xhr.ontimeout = function() {
    this._handleUploadError(
      files,
      xhr,
      'Request timedout after '.concat(this.options.timeout, ' seconds')
    );
  };

  xhr.onerror = function() {
    this._handleUploadError(files, xhr);
  }; // Some browsers do not have the .upload property

  var progressObj = xhr.upload != null ? xhr.upload : xhr;

  progressObj.onprogress = function(e) {
    return this._updateFilesUploadProgress(files, xhr, e);
  };

  var headers = {
    Accept: 'application/json',
    'Cache-Control': 'no-cache',
    'X-Requested-With': 'XMLHttpRequest',
  };

  for (var headerName in headers) {
    var headerValue = headers[headerName];

    if (headerValue) {
      xhr.setRequestHeader(headerName, headerValue);
    }
  }

  var formData = new FormData(); // Adding all @options parameters

  this._addFormElementData(formData); // Finally add the files
  // Has to be last because some servers (eg: S3) expect the file to be the last parameter

  for (var i = 0; i < dataBlocks.length; i++) {
    var dataBlock = dataBlocks[i];
    formData.append(dataBlock.name, dataBlock.data, dataBlock.filename);
  }

  // this.submitRequest(xhr, formData, files);

  xhr.send(formData);
} // Transforms all files with this.options.transformFile and invokes done with the transformed files when done.

//***************

function parseQueryAndRetrieveDICOMWebData(query) {
  return new Promise((resolve, reject) => {
    const url = query.url;

    if (!url) {
      return reject(new Error('No URL was specified. Use ?url=$yourURL'));
    }

    const oReq = new XMLHttpRequest();

    // Add event listeners for request failure
    oReq.addEventListener('error', error => {
      log.warn('An error occurred while retrieving the JSON data');
      reject(error);
    });

    // When the JSON has been returned, parse it into a JavaScript Object
    oReq.addEventListener('load', event => {
      if (event.target.status === 404) {
        reject(new Error('No JSON data found'));
      }

      // Parse the response content
      // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseText
      if (!oReq.responseText) {
        log.warn('Response was undefined');
        reject(new Error('Response was undefined'));
      }

      log.info(JSON.stringify(oReq.responseText, null, 2));

      const data = JSON.parse(oReq.responseText);

      resolve({ studies: data });
    });

    // Open the Request to the server for the JSON data
    // In this case we have a server-side route called /api/
    // which responds to GET requests with the study data
    log.info(`Sending Request to: ${url}`);
    oReq.open('GET', url);
    oReq.setRequestHeader('Accept', 'application/json');

    // Fire the request to the server
    oReq.send();
  });
}
