import cloneDeep from 'lodash.clonedeep';

const defaultState = {
  progress: 0,
  lastUpdated: null,
};

const orthoFlow = (state = defaultState, action) => {
  let progress;
  let lastUpdated;
  console.log('got data: ', action.progressId);
  console.log(action.progressData);

  switch (action.type) {
    case 'SET_INFERENCE_PROGRESS':
      progress = action.progressData;

      // This is a workaround so we can easily identify changes
      // to the progress object without doing deep comparison.
      lastUpdated = new Date().getTime();

      // console.log(
      //   'assign ',
      //   Object.assign({}, state) //, { progress, lastUpdated })
      // );

      // console.log(
      //   'assign new',
      //   Object.assign({}, state, { progress, lastUpdated })
      // );
      return Object.assign({}, state, { progress, lastUpdated });
    // return Object.assign({}, state, { 0: action.progressData });

    case 'CLEAR_INFERENCE_PROGRESS':
      progress = cloneDeep(state).progress;
      delete progress[action.progressId];

      lastUpdated = new Date().getTime();

      return Object.assign({}, state, { progress, lastUpdated });

    default:
      return state;
  }
};

export default orthoFlow;
