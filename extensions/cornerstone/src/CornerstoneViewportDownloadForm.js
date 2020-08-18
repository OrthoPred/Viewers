// import REQUIRED_TAGS from './required_tags';

// import DownZip from 'downzip';
import JSZip from 'jszip';

import React from 'react';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import PropTypes from 'prop-types';

import { ViewportDownloadForm } from '@ohif/ui';
import { utils } from '@ohif/core';

import { getEnabledElement } from './state';

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

const MINIMUM_SIZE = 100;
const DEFAULT_SIZE = 512;
const MAX_TEXTURE_SIZE = 10000;

const CornerstoneViewportDownloadForm = ({
  onClose,
  activeViewportIndex,
  studies,
}) => {
  const activeEnabledElement = getEnabledElement(activeViewportIndex);

  const enableViewport = viewportElement => {
    if (viewportElement) {
      cornerstone.enable(viewportElement);
    }
  };

  const disableViewport = viewportElement => {
    if (viewportElement) {
      cornerstone.disable(viewportElement);
    }
  };

  const updateViewportPreview = (viewportElement, downloadCanvas, fileType) =>
    new Promise(resolve => {
      cornerstone.fitToWindow(viewportElement);

      viewportElement.addEventListener(
        'cornerstoneimagerendered',
        function updateViewport(event) {
          const enabledElement = cornerstone.getEnabledElement(event.target)
            .element;
          const type = 'image/' + fileType;
          const dataUrl = downloadCanvas.toDataURL(type, 1);

          let newWidth = enabledElement.offsetHeight;
          let newHeight = enabledElement.offsetWidth;

          if (newWidth > DEFAULT_SIZE || newHeight > DEFAULT_SIZE) {
            const multiplier = DEFAULT_SIZE / Math.max(newWidth, newHeight);
            newHeight *= multiplier;
            newWidth *= multiplier;
          }

          resolve({ dataUrl, width: newWidth, height: newHeight });

          viewportElement.removeEventListener(
            'cornerstoneimagerendered',
            updateViewport
          );
        }
      );
    });

  const loadImage = (activeViewport, viewportElement, width, height) =>
    new Promise(resolve => {
      if (activeViewport && viewportElement) {
        const enabledElement = cornerstone.getEnabledElement(activeViewport);
        const viewport = Object.assign({}, enabledElement.viewport);
        delete viewport.scale;
        viewport.translation = {
          x: 0,
          y: 0,
        };

        console.log('loadimage id: ', enabledElement);
        cornerstone.loadImage(enabledElement.image.imageId).then(image => {
          console.log('image:', image.windowCenter, image.windowWidth);

          // var blob = new Blob([image.getPixelData()], {
          //   type: 'application/dicom',
          // });
          // var link = document.createElement('a');
          // link.href = window.URL.createObjectURL(blob);
          // link.download = 'proba.dci';
          // link.click();

          cornerstone.displayImage(viewportElement, image);
          cornerstone.setViewport(viewportElement, viewport);
          cornerstone.resize(viewportElement, true);

          const newWidth = Math.min(width || image.width, MAX_TEXTURE_SIZE);
          const newHeight = Math.min(height || image.height, MAX_TEXTURE_SIZE);

          resolve({ image, width: newWidth, height: newHeight });
        });
      }
    });

  const toggleAnnotations = (toggle, viewportElement) => {
    cornerstoneTools.store.state.tools.forEach(({ name }) => {
      if (toggle) {
        cornerstoneTools.setToolEnabledForElement(viewportElement, name);
      } else {
        cornerstoneTools.setToolDisabledForElement(viewportElement, name);
      }
    });
  };

  const downloadBlob = (
    filename,
    fileType,
    viewportElement,
    downloadCanvas,
    studies
  ) => {
    zipAll(studies).then(function(output) {
      //accept
      const url = window.URL.createObjectURL(output);
      console.log(url);
      var link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.download = 'jsons.zip';

      link.click();
    });
  };

  var zipAll = function(studies) {
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
            //Convert JSON Array to string.
            var json = JSON.stringify(meta_tags);
            //Convert JSON string to BLOB.
            json = [json];
            var tags_blob = new Blob(json, {
              type: 'text/plain;charset=utf-8',
            });

            const path = `${instance.url}.json`;
            zip.file(path, tags_blob);
          });
        });
      });

      const blob = zip.generateAsync({ type: 'blob' });
      resolve(blob);
    });
  };

  return (
    <ViewportDownloadForm
      studies={studies}
      onClose={onClose}
      minimumSize={MINIMUM_SIZE}
      maximumSize={MAX_TEXTURE_SIZE}
      defaultSize={DEFAULT_SIZE}
      canvasClass={'cornerstone-canvas'}
      activeViewport={activeEnabledElement}
      enableViewport={enableViewport}
      disableViewport={disableViewport}
      updateViewportPreview={updateViewportPreview}
      loadImage={loadImage}
      toggleAnnotations={toggleAnnotations}
      downloadBlob={downloadBlob}
    />
  );
};

CornerstoneViewportDownloadForm.propTypes = {
  onClose: PropTypes.func,
  activeViewportIndex: PropTypes.number.isRequired,
};

export default CornerstoneViewportDownloadForm;
