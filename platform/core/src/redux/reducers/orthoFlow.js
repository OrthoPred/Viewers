// import cloneDeep from 'lodash.clonedeep';

const defaultState = {
  progress: 'starting',
};

const orthoFlow = (state = defaultState, action) => {
  let results = { progress: 'starting' };
  // let lastUpdated;
  // console.log('got data: ', action.progressId);
  // console.log(action.progressData);

  switch (action.type) {
    case 'SET_INFERENCE_PROGRESS':
      results = action.results;

      return Object.assign({}, state, results);
    // return Object.assign({}, state, { 0: action.progressData });

    case 'CLEAR_INFERENCE_PROGRESS':
      // progress = cloneDeep(state).progress;
      // delete progress[action.progressId];
      // lastUpdated = new Date().getTime();
      // return Object.assign({}, state, { progress, lastUpdated });
      return state;

    default:
      return state;
  }
};

export default orthoFlow;
