import CornerstoneViewportDownloadForm from './CornerstoneViewportDownloadForm';
import { connect } from 'react-redux';
import OHIF from '@ohif/core';

const { setInferenceProgress, clearInferenceProgress } = OHIF.redux.actions;

const mapStateToProps = state => {
  // console.log('state: ', state);
  // console.log(state.orthoFlow.progress, state.orthoFlow.lastUpdated);
  return {
    results: state.orthoFlow.results,
    progressId: state.orthoFlow.lastUpdated,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setInferenceProgress: (progressId, results) => {
      dispatch(setInferenceProgress(progressId, results));
    },
    clearInferenceProgress: progressId => {
      dispatch(clearInferenceProgress(progressId));
    },
  };
};

const ConnectedCornerstoneViewportDownloadForm = connect(
  mapStateToProps,
  mapDispatchToProps
)(CornerstoneViewportDownloadForm);

export default ConnectedCornerstoneViewportDownloadForm;

// ++++++++++++++++++++++++

// import React from 'react'
// import { connect } from 'react-redux'
// import { buyCake } from '../redux'

// function CakeContainer (props) {
//   return (
//     <div>
//       <h2>Number of cakes - {props.numOfCakes} </h2>
//       <button onClick={props.buyCake}>Buy Cake</button>
//     </div>
//   )
// }

// const mapStateToProps = state => {
//   return {
//     numOfCakes: state.cake.numOfCakes
//   }
// }

// const mapDispatchToProps = dispatch => {
//   return {
//     buyCake: () => dispatch(buyCake())
//   }
// }

// export default connect(
//   mapStateToProps,
//   mapDispatchToProps
// )(CakeContainer)
