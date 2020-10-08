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

var prgs = {};
var zipProgress = 0;
var uploadProgress = 0;

// const CornerstoneViewportDownloadForm = props => {
function CornerstoneViewportDownloadForm(props) {
  console.log('upload');
  console.log(props.studies);
  console.log(props.progressData, props.progressId);

  const upload = studies => {
    console.log('before zipAll');

    zipAll(studies).then(
      function(output) {
        //accept
        console.log('after zipAll, before sendreq');
        sendRequest(output).then(function() {
          props.onClose();
          console.log('modal service vége');
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
        });
        console.log('after sendreq');
      },
      function() {
        console.log('reject in dl blob');
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
          const copy = prgs;
          copy[file.name] = {
            state: 'pending',
            percentage: (event.loaded / event.total) * 100,
          };
          uploadProgress = (event.loaded / event.total) * 100;
          //  = metadata.percent.toFixed(2);
          element.style.width = uploadProgress + '%';
          console.log('upload progress: ', uploadProgress + ' %');
        }
      });

      req.upload.addEventListener('load', event => {
        const copy = prgs;
        copy[file.name] = { state: 'done', percentage: 100 };
        prgs = copy;
        console.log('upload event listener load');
        resolve(req.response);
      });

      req.upload.addEventListener('error', event => {
        const copy = prgs;
        copy[file.name] = { state: 'error', percentage: 0 };
        prgs = copy;
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
