// import React, { Component } from 'react';
// // import Dropzone from '../dropzone/Dropzone';
// import './upload.css';
// import Progress from '../progress';

// class Upload extends Component {
//   constructor(props) {
//     super(props);
//     this.state = {
//       files: [],
//       uploading: false,
//       uploadProgress: {},
//       successfullUploaded: false,
//       studies: {},
//     };

//     this.onFilesAdded = this.onFilesAdded.bind(this);
//     this.uploadFiles = this.uploadFiles.bind(this);
//     this.sendRequest = this.sendRequest.bind(this);
//     this.renderActions = this.renderActions.bind(this);
//   }

//   onFilesAdded(files) {
//     this.setState(prevState => ({
//       files: prevState.files.concat(files),
//     }));
//   }

//   async uploadFiles() {
//     console.log('upload button pressed');
//     var zippedfile = this.zipAll(this.props.studies);

//     this.setState({ uploadProgress: {}, uploading: true });
//     const promises = [];
//     zippedfile.forEach(file => {
//       promises.push(this.sendRequest(file));
//     });
//     try {
//       await Promise.all(promises);

//       this.setState({ successfullUploaded: true, uploading: false });
//     } catch (e) {
//       // Not Production ready! Do some error handling here instead...
//       this.setState({ successfullUploaded: true, uploading: false });
//     }
//   }

//   zipAll(studies) {
//     console.log('zip start');
//     var meta_tags = {};

//     const zip = new JSZip();
//     studies.forEach(study => {
//       console.log('StudyInstanceUID:', study.StudyInstanceUID);
//       study.series.forEach(serie => {
//         console.log('\tSeriesInstanceUID:', serie.SeriesInstanceUID);
//         serie.instances.forEach(instance => {
//           REQUIRED_TAGS.forEach(tag => {
//             meta_tags[tag] = instance.metadata[tag];
//           });

//           var img_blob = new Blob([instance.metadata.PixelData], {
//             type: 'application/dicom',
//           });
//           const img_path = `${study.StudyInstanceUID}/${serie.SeriesInstanceUID}/${instance.url}.dci`;
//           zip.file(img_path.replace(':', '_'), img_blob);

//           // var link = document.createElement('a');
//           // link.href = window.URL.createObjectURL(blob);
//           // link.download = 'proba.dci';
//           // link.click();

//           //Convert JSON Array to string.
//           var json = JSON.stringify(meta_tags);
//           //Convert JSON string to BLOB.
//           json = [json];
//           var tags_blob = new Blob(json, {
//             type: 'text/plain;charset=utf-8',
//           });

//           const path = `${study.StudyInstanceUID}/${serie.SeriesInstanceUID}/${instance.url}.json`;
//           zip.file(path.replace(':', '_'), tags_blob);
//         });
//       });
//     });

//     console.log('generate zip start');
//     const blob = zip.generateAsync({ type: 'blob' });
//     console.log('zip end');
//     return blob;
//   }

//   sendRequest(file) {
//     return new Promise((resolve, reject) => {
//       const req = new XMLHttpRequest();

//       req.upload.addEventListener('progress', event => {
//         if (event.lengthComputable) {
//           const copy = { ...this.state.uploadProgress };
//           copy[file.name] = {
//             state: 'pending',
//             percentage: (event.loaded / event.total) * 100,
//           };
//           this.setState({ uploadProgress: copy });
//         }
//       });

//       req.upload.addEventListener('load', event => {
//         const copy = { ...this.state.uploadProgress };
//         copy[file.name] = { state: 'done', percentage: 100 };
//         this.setState({ uploadProgress: copy });
//         resolve(req.response);
//       });

//       req.upload.addEventListener('error', event => {
//         const copy = { ...this.state.uploadProgress };
//         copy[file.name] = { state: 'error', percentage: 0 };
//         this.setState({ uploadProgress: copy });
//         reject(req.response);
//       });

//       const formData = new FormData();
//       formData.append('file', file, file.name);

//       req.open('POST', '/api/upload');
//       req.send(formData);
//     });
//   }

//   renderProgress(file) {
//     const uploadProgress = this.state.uploadProgress[file.name];
//     if (this.state.uploading || this.state.successfullUploaded) {
//       return (
//         <div className="ProgressWrapper">
//           <Progress progress={uploadProgress ? uploadProgress.percentage : 0} />
//           <img
//             className="CheckIcon"
//             alt="done"
//             src="baseline-check_circle_outline-24px.svg"
//             style={{
//               opacity:
//                 uploadProgress && uploadProgress.state === 'done' ? 0.5 : 0,
//             }}
//           />
//         </div>
//       );
//     }
//   }

//   renderActions() {
//     if (this.state.successfullUploaded) {
//       return (
//         <button
//           onClick={() =>
//             this.setState({ files: [], successfullUploaded: false })
//           }
//         >
//           Clear
//         </button>
//       );
//     } else {
//       return (
//         <button
//           disabled={this.state.files.length < 0 || this.state.uploading}
//           onClick={this.uploadFiles}
//         >
//           Upload
//         </button>
//       );
//     }
//   }

//   render() {
//     return (
//       <div className="Upload">
//         <span className="Title">Upload Files</span>
//         <div className="Content">
//           <div></div>
//           <div className="Files">
//             {this.state.files.map(file => {
//               return (
//                 <div key={file.name} className="Row">
//                   <span className="Filename">{file.name}</span>
//                   {this.renderProgress(file)}
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//         <div className="Actions">{this.renderActions()}</div>
//       </div>
//     );
//   }
// }

// export default Upload;
