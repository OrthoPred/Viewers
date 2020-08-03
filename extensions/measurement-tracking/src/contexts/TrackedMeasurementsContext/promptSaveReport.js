/* eslint-disable react/display-name */
import React from 'react';
import { Dialog, Input } from '@ohif/ui';
import createReportAsync from './../../_shared/createReportAsync.js';
import getNextSRSeriesNumber from './../../_shared/getNextSRSeriesNumber.js';

const RESPONSE = {
  NO_NEVER: -1,
  CANCEL: 0,
  CREATE_REPORT: 1,
  ADD_SERIES: 2,
  SET_STUDY_AND_SERIES: 3,
  NO_NOT_FOR_SERIES: 4,
};

function promptUser({ servicesManager, extensionManager }, ctx, evt) {
  const {
    UIDialogService,
    MeasurementService,
    DisplaySetService,
  } = servicesManager.services;
  const viewportIndex =
    evt.viewportIndex === undefined
      ? evt.data.viewportIndex
      : evt.viewportIndex;
  const isBackupSave =
    evt.isBackupSave === undefined ? evt.data.isBackupSave : evt.isBackupSave;
  const StudyInstanceUID = evt?.data?.StudyInstanceUID;
  const SeriesInstanceUID = evt?.data?.SeriesInstanceUID;

  const { trackedStudy, trackedSeries } = ctx;
  let displaySetInstanceUIDs;

  return new Promise(async function(resolve, reject) {
    // TODO: Fallback if (UIDialogService) {
    const promptResult = await _createReportDialogPrompt(UIDialogService);

    if (promptResult.action === RESPONSE.CREATE_REPORT) {
      // TODO: use `promptResult.value` to set seriesDescription
      const dataSources = extensionManager.getDataSources();
      const dataSource = dataSources[0];
      const measurements = MeasurementService.getMeasurements();
      const trackedMeasurements = measurements.filter(
        m =>
          trackedStudy === m.referenceStudyUID &&
          trackedSeries.includes(m.referenceSeriesUID)
      );

      const SeriesDescription =
        // isUndefinedOrEmpty
        promptResult.value === undefined || promptResult.value === ''
          ? 'Research Derived Series' // default
          : promptResult.value; // provided value

      const SeriesNumber = getNextSRSeriesNumber(DisplaySetService);

      displaySetInstanceUIDs = await createReportAsync(
        servicesManager,
        dataSource,
        trackedMeasurements,
        {
          SeriesDescription,
          SeriesNumber,
        }
      );
    } else if (promptResult.action === RESPONSE.CANCEL) {
      // Do nothing
    }

    resolve({
      userResponse: promptResult.action,
      createdDisplaySetInstanceUIDs: displaySetInstanceUIDs,
      StudyInstanceUID,
      SeriesInstanceUID,
      viewportIndex,
      isBackupSave,
    });
  });
}

export default promptUser;

function _createReportDialogPrompt(UIDialogService) {
  return new Promise(function(resolve, reject) {
    let dialogId = undefined;

    const _handleClose = () => {
      // Dismiss dialog
      UIDialogService.dismiss({ id: dialogId });
      // Notify of cancel action
      resolve({ action: RESPONSE.CANCEL, value: undefined });
    };

    /**
     *
     * @param {string} param0.action - value of action performed
     * @param {string} param0.value - value from input field
     */
    const _handleFormSubmit = ({ action, value }) => {
      UIDialogService.dismiss({ id: dialogId });
      switch (action.id) {
        case 'save':
          resolve({ action: RESPONSE.CREATE_REPORT, value: value.label });
          break;
        case 'cancel':
          resolve({ action: RESPONSE.CANCEL, value: undefined });
          break;
      }
    };

    dialogId = UIDialogService.create({
      centralize: true,
      isDraggable: false,
      content: Dialog,
      useLastPosition: false,
      showOverlay: true,
      contentProps: {
        title: 'Provide a name for your report',
        value: { label: '' },
        noCloseButton: true,
        onClose: _handleClose,
        actions: [
          { id: 'cancel', text: 'Cancel', type: 'secondary' },
          { id: 'save', text: 'Save', type: 'primary' },
        ],
        // TODO: Should be on button press...
        onSubmit: _handleFormSubmit,
        body: ({ value, setValue }) => {
          const onChangeHandler = event => {
            event.persist();
            setValue(value => ({ ...value, label: event.target.value }));
          };
          const onKeyPressHandler = event => {
            if (event.key === 'Enter') {
              UIDialogService.dismiss({ id: dialogId });
              resolve({ action: RESPONSE.CREATE_REPORT, value: value.label });
            }
          };
          return (
            <div className="p-4 bg-primary-dark">
              <Input
                autoFocus
                className="mt-2 bg-black border-primary-main"
                type="text"
                containerClassName="mr-2"
                value={value.label}
                onChange={onChangeHandler}
                onKeyPress={onKeyPressHandler}
              />
            </div>
          );
        },
      },
    });
  });
}