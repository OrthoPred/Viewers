import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import dcmjs from 'dcmjs';
import OHIF from '@ohif/core';

class FileLoader {
  fileType;
  loadFile(file, imageId) {}
  getDataset(image, imageId) {}
  getStudies(dataset, imageId) {}
}

const metadataProvider = OHIF.cornerstone.metadataProvider;

const DICOMFileLoader = new (class extends FileLoader {
  fileType = 'application/dicom';
  loadFile(file, imageId) {
    return cornerstoneWADOImageLoader.wadouri.loadFileRequest(imageId);
  }

  getDataset(image, imageId) {
    let dataset = {};
    try {
      const dicomData = dcmjs.data.DicomMessage.readFile(image);

      dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(
        dicomData.dict
      );

      metadataProvider.addInstance(dataset);

      dataset._meta = dcmjs.data.DicomMetaDictionary.namifyDataset(
        dicomData.meta
      );
    } catch (e) {
      console.error('Error reading dicom file', e);
    }
    // Set imageId on dataset to be consumed later on
    dataset.imageId = imageId;

    return dataset;
  }

  getStudies(dataset, imageId) {
    return this.getStudyFromDataset(dataset);
  }

  getStudyFromDataset(dataset = {}) {
    const {
      StudyInstanceUID,
      StudyDate,
      StudyTime,
      AccessionNumber,
      // ReferringPhysicianName,
      PatientName,
      PatientID,
      PatientBirthDate,
      PatientSex,
      StudyID,
      StudyDescription,
      SeriesInstanceUID,
      SeriesDescription,
      SeriesNumber,
      imageId,
    } = dataset;

    const instance = {
      metadata: dataset,
      url: imageId,
    };

    const series = {
      SeriesInstanceUID: SeriesInstanceUID,
      SeriesDescription: SeriesDescription,
      SeriesNumber: SeriesNumber,
      instances: [instance],
    };

    const study = {
      StudyInstanceUID,
      StudyDate,
      StudyTime,
      AccessionNumber,
      //ReferringPhysicianName,
      PatientName,
      PatientID,
      PatientBirthDate,
      PatientSex,
      StudyID,
      StudyDescription,
      series: [series],
    };

    return study;
  }
})();

class FileLoaderService extends FileLoader {
  fileType;
  loader;
  constructor(file) {
    super();
    const fileType = file && file.type;
    this.loader = this.getLoader(fileType);
    this.fileType = this.loader.fileType;
  }

  static groupSeries(studies) {
    // console.log('groupseries ', studies);
    const groupBy = (list, groupByKey, listKey) => {
      let nonKeyCounter = 1;

      return list.reduce((acc, obj) => {
        //acc: The initialValue, or the previously returned value of the function
        //obj: The value of the current element
        //The reduce() method reduces the array to a single value.
        //The reduce() method executes a provided function for each value of the array (from left-to-right).

        if (groupByKey === 'StudyInstanceUID') {
          if (typeof obj === 'undefined') {
            return acc;
          } else if (typeof obj.StudyInstanceUID === 'undefined') {
            return acc;
          }
        }

        // console.log('acc: ', acc);
        // console.log('obj: ', obj);
        // console.log('key: ', groupByKey);

        let key = obj[groupByKey]; //obj: The value of the current element
        //groupByKey: először: 'StudyInstanceUID' , aztán 'SeriesInstanceUID'
        const list = obj[listKey]; //obj: The value of the current element
        // listKey először: 'series' , aztán 'instances' (kép)

        // in case key not found, group it using counter
        key = !!key ? key : '' + nonKeyCounter++;

        if (!acc[key]) {
          acc[key] = { ...obj };
          acc[key][listKey] = [];
        }

        acc[key][listKey].push(...list);

        return acc;
      }, {}); //{}: initial value
    };

    const studiesGrouped = Object.values(
      groupBy(studies, 'StudyInstanceUID', 'series')
    );

    const result = studiesGrouped.map(studyGroup => {
      const seriesGrouped = groupBy(
        studyGroup.series,
        'SeriesInstanceUID',
        'instances'
      );
      studyGroup.series = Object.values(seriesGrouped);

      return studyGroup;
    });

    return result;
  }

  addFile(file) {
    // console.log('fileloadservice.addFile ', file.name);
    return cornerstoneWADOImageLoader.wadouri.fileManager.add(file);
  }

  loadFile(file, imageId) {
    // console.log('fileloadservice.loadFile ', file.name, imageId);
    return this.loader.loadFile(file, imageId);
  }

  getDataset(image, imageId) {
    // console.log('fileloadservice.getDataset ', imageId);
    return this.loader.getDataset(image, imageId);
  }

  getStudies(dataset, imageId) {
    // console.log('fileloadservice.getStudies ', imageId);
    return this.loader.getStudies(dataset, imageId);
  }

  getLoader(fileType) {
    if (fileType === 'application/pdf') {
      return PDFFileLoader;
    } else {
      // Default to dicom loader
      return DICOMFileLoader;
    }
  }
}

// var filesNo = 0;

// const empty_study = {};

async function processFile(file) {
  // filesNo += 1;
  // setState({ loadedNo: filesNo });
  // ViewerLocalFileData.filesNo = filesNo;
  // console.log('callback: ', callback);
  if (file.size < 1 * 1024 * 1024) {
    var lc_fname = file.name.toLowerCase();
    var ext = lc_fname.split('.').pop();
    if (ext === lc_fname || ext === 'dcm' || ext === 'img') {
      try {
        // console.log('fname: ', file.name);
        const fileLoaderService = new FileLoaderService(file);
        const imageId = fileLoaderService.addFile(file);
        const image = await fileLoaderService.loadFile(file, imageId);
        const dataset = await fileLoaderService.getDataset(image, imageId);
        const studies = await fileLoaderService.getStudies(dataset, imageId);
        // console.log('studies from processfile: ', studies);
        return studies;
      } catch (error) {
        console.log(
          error.name,
          ':Error when trying to load and process local files:',
          error.message
        );
        // return empty_study;
        return;
      }
    } else {
      // console.log('rossz filename: ', file.name);
      return;
    }
  }
}

export default async function filesToStudies(files) {
  const processFilesPromises = files.flatMap(processFile);
  const studies = await Promise.all(processFilesPromises);
  return FileLoaderService.groupSeries(studies.flat());
}

//https://reactjs.org/docs/state-and-lifecycle.html
