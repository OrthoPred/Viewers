// import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
// // import FileLoader from './fileLoader';
// // import PDFFileLoader from './pdfFileLoader';
// import DICOMFileLoader from './dicomFileLoader';

// class FileLoader {
//   fileType;
//   loadFile(file, imageId) {}
//   getDataset(image, imageId) {}
//   getStudies(dataset, imageId) {}
// }

// class FileLoaderService extends FileLoader {
//   fileType;
//   loader;
//   constructor(file) {
//     super();
//     const fileType = file && file.type;
//     this.loader = this.getLoader(fileType);
//     this.fileType = this.loader.fileType;
//   }

//   static groupSeries(studies) {
//     // console.log('groupseries ', studies);
//     const groupBy = (list, groupByKey, listKey) => {
//       let nonKeyCounter = 1;

//       return list.reduce((acc, obj) => {
//         //acc: The initialValue, or the previously returned value of the function
//         //obj: The value of the current element
//         //The reduce() method reduces the array to a single value.
//         //The reduce() method executes a provided function for each value of the array (from left-to-right).

//         if (groupByKey === 'StudyInstanceUID') {
//           if (typeof obj === 'undefined') {
//             return acc;
//           } else if (typeof obj.StudyInstanceUID === 'undefined') {
//             return acc;
//           }
//         }

//         // console.log('acc: ', acc);
//         // console.log('obj: ', obj);
//         // console.log('key: ', groupByKey);

//         let key = obj[groupByKey]; //obj: The value of the current element
//         //groupByKey: először: 'StudyInstanceUID' , aztán 'SeriesInstanceUID'
//         const list = obj[listKey]; //obj: The value of the current element
//         // listKey először: 'series' , aztán 'instances' (kép)

//         // in case key not found, group it using counter
//         key = !!key ? key : '' + nonKeyCounter++;

//         if (!acc[key]) {
//           acc[key] = { ...obj };
//           acc[key][listKey] = [];
//         }

//         acc[key][listKey].push(...list);

//         return acc;
//       }, {}); //{}: initial value
//     };

//     const studiesGrouped = Object.values(
//       groupBy(studies, 'StudyInstanceUID', 'series')
//     );

//     const result = studiesGrouped.map(studyGroup => {
//       const seriesGrouped = groupBy(
//         studyGroup.series,
//         'SeriesInstanceUID',
//         'instances'
//       );
//       studyGroup.series = Object.values(seriesGrouped);

//       return studyGroup;
//     });

//     return result;
//   }

//   addFile(file) {
//     // console.log('fileloadservice.addFile ', file.name);
//     return cornerstoneWADOImageLoader.wadouri.fileManager.add(file);
//   }

//   loadFile(file, imageId) {
//     // console.log('fileloadservice.loadFile ', file.name, imageId);
//     return this.loader.loadFile(file, imageId);
//   }

//   getDataset(image, imageId) {
//     // console.log('fileloadservice.getDataset ', imageId);
//     return this.loader.getDataset(image, imageId);
//   }

//   getStudies(dataset, imageId) {
//     // console.log('fileloadservice.getStudies ', imageId);
//     return this.loader.getStudies(dataset, imageId);
//   }

//   getLoader(fileType) {
//     if (fileType === 'application/pdf') {
//       return PDFFileLoader;
//     } else {
//       // Default to dicom loader
//       return DICOMFileLoader;
//     }
//   }
// }

// export default FileLoaderService;
