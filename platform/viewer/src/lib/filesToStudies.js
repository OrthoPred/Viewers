import FileLoaderService from './localFileLoaders/fileLoaderService';
// import ViewerLocalFileData from '../connectedComponents/ViewerLocalFileData';

// var filesNo = 0;
async function processFile(file) {
  // filesNo += 1;
  // setState({ loadedNo: filesNo });
  // ViewerLocalFileData.filesNo = filesNo;
  // console.log('callback: ', callback);
  if (file.size < 2 * 1024 * 1024) {
    var lc_fname = file.name.toLowerCase();
    var ext = lc_fname.split('.').pop();
    if (ext === lc_fname || ext === 'dcm' || ext === 'img') {
      try {
        const fileLoaderService = new FileLoaderService(file);
        const imageId = fileLoaderService.addFile(file);
        const image = await fileLoaderService.loadFile(file, imageId);
        const dataset = await fileLoaderService.getDataset(image, imageId);
        const studies = await fileLoaderService.getStudies(dataset, imageId);

        return studies;
      } catch (error) {
        console.log(
          error.name,
          ':Error when trying to load and process local files:',
          error.message
        );
      }
    }
  }
}

export default async function filesToStudies(files) {
  const processFilesPromises = files.map(processFile);
  const studies = await Promise.all(processFilesPromises);
  return FileLoaderService.groupSeries(studies.flat());
}
// //https://reactjs.org/docs/state-and-lifecycle.html

// export default async function filesToStudies(files) {
//   var studies = [];
//   for (let index = 0; index < files.length; index++) {
//     studies.push(await processFile(files[index]));
//     console.log('progress: ', index);
//     callback = 0;
//   }
//   return FileLoaderService.groupSeries(studies.flat());
// }

// class filesToStudies extends Component {

//   render() {
//     var studies = [];
//     const files = this.props.files;
//     for (let index = 0; index < files.length; index++) {
//       studies.push(await processFile(files[index]));
//       console.log('progress: ', index);
//       callback = 0;
//       }
//     return FileLoaderService.groupSeries(studies.flat());
//     };

//     return (

//     );
//   }
