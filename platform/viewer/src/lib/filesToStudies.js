import FileLoaderService from './localFileLoaders/fileLoaderService';

import dicomParser, { DataSet } from './js/dicomParser';
import dataDict from './js/dataDict';

const processFile = async file => {
  try {
    console.log('file:', file);

    dumpFile(file);
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
};

export default async function filesToStudies(files) {
  const processFilesPromises = files.map(processFile);
  const studies = await Promise.all(processFilesPromises);

  return FileLoaderService.groupSeries(studies.flat());
}

//   console.log("accept start for: ", file.name);

//   dumpFile(file).then(

//     function (output) { //accept
//       console.log("blob returned for ", file.name);
//       var blob = output[0];
//       var tags = output[1];
//       var urlll = URL.createObjectURL(file);

//       if (imageIds[tags.stuid] == undefined) {
//         imageIds[tags.stuid] = {};
//       }

//       if (imageIds[tags.stuid][tags.seruid] == undefined) {
//         imageIds[tags.stuid][tags.seruid] = {"IOP": tags.IOP, "images": []};
//       }

//       if (imageIds[tags.stuid][tags.seruid]["IOP"] != tags.IOP) {
//         console.log(imageIds[tags.stuid][tags.seruid]["IOP"], " , ", tags.IOP);
//         console.log("IOP hiba!!!!!!!!!!!!!!!!!!!!%%%%%%%%%%%%%%%%");
//       }
//       //console.log(imageIds);
//       var topush = {'URL': "wadouri:" + urlll, "IPP": tags.IPP};
//       imageIds[tags.stuid][tags.seruid]['images'].push(topush);

//       if (blob) {
//         console.log("accept finished for: ", file.name);
//         done("", blob);
//       } else {
//         console.log("accept finished, blob hiba: ", file.name);
//       }
//     },
//     function (output) { //reject
//       console.log("accept finished with (catch) for: ", file.name);
//       console.log("(catch) message " + output);
//       done(output, file);
//     }
//   );
// }

var dumpFile = function(file) {
  console.log('dumpFile ', file.name);
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload = function(file) {
      var arrayBuffer = reader.result;

      // Here we have the file data as an ArrayBuffer.  dicomParser requires as input a
      // Uint8Array so we create that here
      var byteArray = new Uint8Array(arrayBuffer);

      var kb = byteArray.length / 1024;
      var mb = kb / 1024;
      var byteStr = mb > 1 ? mb.toFixed(3) + ' MB' : kb.toFixed(0) + ' KB';

      console.log('file size: ', byteStr);

      try {
        var start = new Date().getTime();
        // Invoke the paresDicom function and get back a DataSet object with the contents
        var dataSet = dicomParser.parseDicom(byteArray);
        console.log('succesfully parsed');

        var end = new Date().getTime();
        var time = end - start;
        if (dataSet.warnings.length > 0) {
          console.log('dataset warnings: ', DataSet.warnings);
        } else {
          var pixelData = dataSet.elements.x7fe00010;
          if (pixelData) {
            // var anonim_result = anonymizeDataSet(dataSet);
            var anonim_result = true;
            console.log('anoimization finished');
            if (anonim_result.success != true) {
              console.log('anoimization succesful');
              var blob = new Blob([dataSet.byteArray], {
                type: 'application/dicom',
              });

              console.log('returning blob');
              // allAcceptedFiles += 1;
              resolve([blob, anonim_result]);
            } else {
              console.log('anonimization failed');
              var exit_code = 'Deidentification failed';
              console.log('exit code: ' + exit_code);
              reject(exit_code);
            }
          } else {
            var exit_code = 'No image found in this DICOM file';
            console.log('exit code: ' + exit_code);
            reject(exit_code);
          }
        }
        console.log('nem kéne itt lenni');
      } catch (err) {
        var exit_code = 'Not a valid DICOM file';
        console.log('exit code: ' + exit_code + err);
        reject(exit_code);
      }
    };
    reader.readAsArrayBuffer(file);
  });
};

// function anonymizeDataSet(dataSet, output) {
//   console.log("start anonymization");
//   var tags_dict = {};
//     // out = ("</ul>");
//     // $('#dd-ul').append(out);
//     // console.log("\t" + out);

//     // out = ("</li>");
//     // $('#dd-ul').append(out);
//     // console.log(out);
//   try {
//     // This function iterates through dataSet recursively
//     for (var propertyName in dataSet.elements) {

//       if (propertyName.toUpperCase() == "X0020000D") { //StudyInstanceUID
//         tags_dict["stuid"] = dataSet.text(propertyName);
//         console.log("stuid: ", tags_dict.stuid);
//       }
//       if (propertyName.toUpperCase() == "X0020000E") { //SeriesInstanceUID
//         tags_dict["seruid"] = dataSet.text(propertyName);
//         console.log("seruid: ", tags_dict.seruid);
//       }
//       if (propertyName.toUpperCase() == "X00080060") { //Modality
//         tags_dict["modality"] = dataSet.text(propertyName);
//       }
//       if (propertyName.toUpperCase() == 'X00200037') { // ImageOrientationPatient
//         tags_dict["IOP"] = dataSet.text(propertyName);
//         // console.log(tags_dict["IOP"].split("\\"));
//       }
//       if (propertyName.toUpperCase() == 'X00200032') { // ImagePositionPatient
//         tags_dict["IPP"] = dataSet.text(propertyName);
//         // console.log(parseFloat(tags_dict["IPP"].split("\\")[1]));
//       }
//       var td = TAG_DICT[propertyName.toUpperCase()];
//       if (!td) {
//         continue;
//       }
//       var vr = td.vr;
//       var deIdentifiedValue = "";
//       var action = RULES_DICT[TAG_DICT[propertyName.toUpperCase()].name];
//       var element = dataSet.elements[propertyName];

//       if (action == "" || vr == "AT" || vr == "OB" || vr == "OD" || vr == "OF" || vr == "OW" || vr == "SQ" || vr == "UN") {
//         continue;
//       }
//       else if (vr == "FL" || vr == "FD" || vr == "SL" || vr == "SS" || vr == "UL" || vr == "US" ||
//               vr == "OW|OB" || vr == "OB|OW" || vr == "US|SS" || vr == "US|SS|OW" || vr == "US|OW") {

//         for (var i = 0; i < element.length; i++) {
//           // console.log("data: " + dataSet.byteArray[element.dataOffset + i]);
//           dataSet.byteArray[element.dataOffset + i] = 0;
//           // console.log("written", + dataSet.byteArray[element.dataOffset + i]);
//         }
//       }
//       else if (vr == "AE" || vr == "AS" || vr == "CS" || vr == "DA" || vr == "DT" || vr == "DS" || vr == "IS" ||
//               vr == "LO" || vr == "LT" || vr == "PN" || vr == "SH" || vr == "ST" || vr == "TM" || vr == "UI" || vr == "UT") {

//         var text = "";

//         if (element !== undefined) {
//           var str = dataSet.text(propertyName);
//           if (str !== undefined) {
//             text = str;
//           }
//         }
//         // console.log("text:" + text);
//         var deid = text.replace(/[a-z]/gi, "B").replace(/\d/g, "1");

//         if (vr == "UI") {
//           // console.log(TAG_DICT[propertyName.toUpperCase()].name);
//           // console.log(dataSet.text(propertyName));
//           // console.log(deid);

//           for (var i = 0; i < text.length; i++) {
//             var char = deid.charCodeAt(i);
//             dataSet.byteArray[element.dataOffset + i] = char;
//           }

//         }
//         else {
//           if (action) {
//             deid = action;
//           }
//           for (var i = 0; i < element.length; i++) {
//             var char = deid.length > i ? deid.charCodeAt(i) : vr == "UI" ? 0 : 32;
//             dataSet.byteArray[element.dataOffset + i] = char;
//           }
//         }
//       }
//     }
//     tags_dict["success"] = true;
//     return tags_dict;
//   }
//   catch (err) {
//     console.log("error: " + err);
//     var ex = {exception: err, output: output,};
//     throw ex;
//     tags_dict["success"] = false;
//     return tags_dict;
//   }
// }
