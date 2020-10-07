const isImportant = tags => {
  // console.log(tags.ScanningSequence, tags.Modality);
  if (tags.Modality === 'MR' && tags.PixelData && tags.ScanningSequence) {
    if (
      tags.ScanningSequence.includes('SE') ||
      tags.ScanningSequence.includes('RM')
    ) {
      if (
        !tags.ScanningSequence.includes('IR') &&
        !tags.ScanningSequence.includes('EP')
      ) {
        // console.log('important');
        return true;
      } else {
        console.log('EP or IR !!!!');
      }
    } else {
      console.log('not SE / RM');
    }
  } else {
    console.log('not MR / no pixel data / no scanningSequence');
  }
  console.log('not important');
  return false;
};

export default isImportant;
