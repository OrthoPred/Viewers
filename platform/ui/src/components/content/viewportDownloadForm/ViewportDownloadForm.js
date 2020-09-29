import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import './ViewportDownloadForm.styl';

const ViewportDownloadForm = ({
  studies,
  onClose,

  downloadBlob,
}) => {
  const [t] = useTranslation('ViewportDownloadForm');

  const downloadImage = () => {
    // console.log('studies from vp dl form:', studies);
    downloadBlob(studies);
  };

  return (
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
            onClick={downloadImage}
            className="btn btn-primary"
            data-cy="download-btn"
          >
            {t('Buttons:Download')}
          </button>
        </div>
      </div>
    </div>
  );
};

ViewportDownloadForm.propTypes = {
  studies: PropTypes.array.isRequired, //***** */
  onClose: PropTypes.func.isRequired,
  downloadBlob: PropTypes.func.isRequired,
};

export default ViewportDownloadForm;
