// import REQUIRED_TAGS from './required_tags';

// import DownZip from 'downzip';
import JSZip from 'jszip';

import React from 'react';
// import cornerstone from 'cornerstone-core';
// import cornerstoneTools from 'cornerstone-tools';
import PropTypes from 'prop-types';

// import { ViewportDownloadForm } from '@ohif/ui';
// import { utils } from '@ohif/core';
import Progress from '../../../platform/viewer/src/progress';
import '../../../platform/viewer/src/progress/progress.css';

import { useTranslation } from 'react-i18next';

import '@ohif/ui/src/components/content/viewportDownloadForm/ViewportDownloadForm.styl';
import { render } from 'stylus';

// import { getEnabledElement } from './state';

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
var zipProgress = 10;

const CornerstoneViewportDownloadForm = ({
  onClose,
  // activeViewportIndex,
  studies,
}) => {
  const downloadBlob = studies => {
    console.log('before zipAll', studies);
    zipAll(studies).then(function(output) {
      //accept
      console.log('after zipAll, before sendreq');
      sendRequest(output).then(function() {
        onClose();
      });
      console.log('after sendreq');
    });
  };

  const [t] = useTranslation('ViewportDownloadForm');

  var zipAll = function() {
    var element = document.getElementById('myBar');
    return new Promise(function(resolve, reject) {
      var meta_tags = {};

      const zip = new JSZip();
      studies.forEach(study => {
        console.log('StudyInstanceUID:', study.StudyInstanceUID);
        study.series.forEach(serie => {
          console.log('\tSeriesInstanceUID:', serie.SeriesInstanceUID);
          serie.instances.forEach(instance => {
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
          });
        });
      });

      const blob = zip.generateAsync({ type: 'blob' }, function updateCallback(
        metadata
      ) {
        zipProgress = metadata.percent.toFixed(2);
        element.style.width = zipProgress + '%';
        console.log('zip progress: ', zipProgress + ' %');
      });

      // const blob = zip.generateAsync({ type: 'blob' });
      resolve(blob);
    });
  };

  // const downloadImage = () => {
  //   console.log('studies from vp dl form:', studies);
  //   downloadBlob(studies);
  // };

  var sendRequest = function(file) {
    return new Promise((resolve, reject) => {
      const req = new XMLHttpRequest();

      req.upload.addEventListener('progress', event => {
        if (event.lengthComputable) {
          const copy = prgs;
          copy[file.name] = {
            state: 'pending',
            percentage: (event.loaded / event.total) * 100,
          };
          console.log('progress: ', (event.loaded / event.total) * 100);
          prgs = copy;
          console.log('prgs progress: ', prgs.percentage);
        }
      });

      req.upload.addEventListener('load', event => {
        const copy = prgs;
        copy[file.name] = { state: 'done', percentage: 100 };
        prgs = copy;
        console.log('upload event load');
        resolve(req.response);
      });

      req.upload.addEventListener('error', event => {
        const copy = prgs;
        copy[file.name] = { state: 'error', percentage: 0 };
        prgs = copy;
        console.log('upload event error');
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
          <div
            className="Progress"
            // style={{ width: this.props.progress + '%' }}
          />
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
      {/* <ViewportDownloadForm
        studies={studies}
        onClose={onClose}
        downloadBlob={downloadBlob}
      ></ViewportDownloadForm> */}

      <div className="ViewportDownloadForm">
        <div className="actions">
          <div className="action-cancel">
            <button
              type="button"
              data-cy="cancel-btn"
              className="btn btn-danger"
              onClick={onClose}
            >
              {t('Buttons:Cancel')}
            </button>
          </div>
          <div className="action-save">
            <button
              // disabled={hasError}
              onClick={downloadBlob}
              className="btn btn-primary"
              data-cy="download-btn"
            >
              {t('Buttons:Download')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

CornerstoneViewportDownloadForm.propTypes = {
  onClose: PropTypes.func,
  activeViewportIndex: PropTypes.number.isRequired,
};

export default CornerstoneViewportDownloadForm;
