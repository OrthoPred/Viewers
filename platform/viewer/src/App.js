import React, { Component } from 'react';
import { I18nextProvider } from 'react-i18next';
import PropTypes from 'prop-types'; //Runtime type checking for React props and similar objects.
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import { hot } from 'react-hot-loader/root';
import OHIFCornerstoneExtension from '@ohif/extension-cornerstone';
import { DndProvider } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import i18n from '@ohif/i18n';
import { setConfiguration } from './config';

import guid from '@ohif/core/src/utils/guid';

import {
  SnackbarProvider, //felugró státusz üzenet
  ModalProvider, //felugró üzenet gombokkal
  DialogProvider,
  OHIFModal,
  ErrorBoundary,
} from '@ohif/ui';

import {
  CommandsManager,
  ExtensionManager,
  ServicesManager,
  HotkeysManager,
  UINotificationService,
  UIModalService,
  UIDialogService,
  //utils,
  // redux as reduxOHIF,
} from '@ohif/core';

import { initWebWorkers } from './utils/index.js';

// import { GenericViewerCommands } from './appExtensions';
import ViewerLocalFileData from './connectedComponents/ViewerLocalFileData';

/** Store */
import { getActiveContexts } from './store/layout/selectors.js';
import store from './store';

/** Contexts */
import { AppProvider, useAppContext, CONTEXTS } from './context/AppContext';

import DrawBBoxTool from './DrawBBoxTool';
// import { import as csTools, toolColors } from 'cornerstone-tools';

import cornerstone from 'cornerstone-core';
// import cornerstoneMath from 'cornerstone-math';
import cornerstoneTools from 'cornerstone-tools';
// import Hammer from 'hammerjs';

cornerstoneTools.external.cornerstone = cornerstone;
// cornerstoneTools.external.Hammer = Hammer;
// cornerstoneTools.external.cornerstoneMath = cornerstoneMath;

cornerstoneTools.init();

// ...

cornerstoneTools.addTool(DrawBBoxTool);
cornerstoneTools.setToolEnabled('DrawBBox');

/** ~~~~~~~~~~~~~ Application Setup */
const commandsManagerConfig = {
  getAppState: () => store.getState(),
  getActiveContexts: () => getActiveContexts(store.getState()),
};

/** Managers */
const commandsManager = new CommandsManager(commandsManagerConfig);
const servicesManager = new ServicesManager();
console.log('const  sevicemanager ');
const hotkeysManager = new HotkeysManager(commandsManager, servicesManager);
let extensionManager;
/** ~~~~~~~~~~~~~ End Application Setup */

// TODO[react] Use a provider when the whole tree is React
window.store = store;

window.ohif = window.ohif || {};
window.ohif.app = {
  commandsManager,
  hotkeysManager,
  servicesManager,
  extensionManager,
};

class App extends Component {
  static propTypes = {
    config: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.shape({
        routerBasename: PropTypes.string.isRequired,
        oidc: PropTypes.array,
        extensions: PropTypes.array,
      }),
    ]).isRequired,
    defaultExtensions: PropTypes.array,
  };

  static defaultProps = {
    config: {
      showStudyList: true,
      oidc: [],
      extensions: [],
    },
    defaultExtensions: [],
  };

  _appConfig;

  constructor(props) {
    super(props);

    const { config, defaultExtensions } = props;

    const appDefaultConfig = {
      showStudyList: false,
      cornerstoneExtensionConfig: {},
      extensions: [],
      routerBasename: '/',
    };

    this._appConfig = {
      ...appDefaultConfig,
      ...(typeof config === 'function' ? config({ servicesManager }) : config),
    };

    const {
      hotkeys: appConfigHotkeys,
      cornerstoneExtensionConfig,
      extensions,
    } = this._appConfig;

    sendSessionName();
    setConfiguration(this._appConfig);

    _initServices([
      UINotificationService,
      UIModalService,
      UIDialogService,
      //MeasurementService,
    ]);
    _initExtensions(
      [...defaultExtensions, ...extensions],
      cornerstoneExtensionConfig,
      this._appConfig
    );

    /*
     * Must run after extension commands are registered
     * if there is no hotkeys from localStorage set up from config.
     */
    _initHotkeys(appConfigHotkeys);
    initWebWorkers();
  }

  render() {
    const { routerBasename } = this._appConfig;
    const {
      UINotificationService,
      UIDialogService,
      UIModalService,
      //MeasurementService,
    } = servicesManager.services;

    return (
      <ErrorBoundary context="App">
        <Provider store={store}>
          <AppProvider config={this._appConfig}>
            <I18nextProvider i18n={i18n}>
              {' '}
              {/*I18next is an internationalization-framework */}
              <Router basename={routerBasename}>
                <SnackbarProvider service={UINotificationService}>
                  <DialogProvider service={UIDialogService}>
                    <ModalProvider modal={OHIFModal} service={UIModalService}>
                      {' '}
                      {/* toolbarhoz kell !!! */}
                      <DndProvider backend={HTML5Backend}>
                        <ViewerLocalFileData />
                      </DndProvider>
                    </ModalProvider>
                  </DialogProvider>
                </SnackbarProvider>
              </Router>
            </I18nextProvider>
          </AppProvider>
        </Provider>
      </ErrorBoundary>
    );
  }
}

function sendSessionName() {
  const uid = guid();
  console.log('guid: ', uid);
  var xhr = new XMLHttpRequest();
  var url = '/api/session/';
  xhr.open('POST', url, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      // var json = JSON.parse(xhr.responseText);
    }
  };
  var data = JSON.stringify({ guid: uid });
  xhr.send(data);
}

function _initServices(services) {
  console.log('init services: ', services);
  servicesManager.registerServices(services);
  console.log('registered: ', servicesManager);
}

/**
 * @param
 */
function _initExtensions(extensions, cornerstoneExtensionConfig, appConfig) {
  extensionManager = new ExtensionManager({
    commandsManager,
    servicesManager,
    appConfig,
    api: {
      contexts: CONTEXTS,
      hooks: {
        useAppContext,
      },
    },
  });

  const requiredExtensions = [
    //GenericViewerCommands, //??????????????????????????????????????????????????????????????????????
    [OHIFCornerstoneExtension, cornerstoneExtensionConfig],
    /* WARNING: MUST BE REGISTERED _AFTER_ OHIFCornerstoneExtension */
    //MeasurementsPanel,
  ];
  // const mergedExtensions = requiredExtensions.concat(extensions);
  extensionManager.registerExtensions(requiredExtensions); //mergedExtensions); !!!!!!!!!!!!!!!!!!!!!!!!!!!!
}

/**
 *
 * @param {Object} appConfigHotkeys - Default hotkeys, as defined by app config
 */
function _initHotkeys(appConfigHotkeys) {
  // TODO: Use something more resilient
  // TODO: Mozilla has a special library for this
  const userPreferredHotkeys = JSON.parse(
    localStorage.getItem('hotkey-definitions') || '{}'
  );

  // TODO: hotkeysManager.isValidDefinitionObject(/* */)
  const hasUserPreferences =
    userPreferredHotkeys && Object.keys(userPreferredHotkeys).length > 0;
  if (hasUserPreferences) {
    hotkeysManager.setHotkeys(userPreferredHotkeys);
  } else {
    hotkeysManager.setHotkeys(appConfigHotkeys);
  }

  hotkeysManager.setDefaultHotKeys(appConfigHotkeys);
}

/*
 * Only wrap/use hot if in dev.
 */

console.log('itt a vége: ', servicesManager);
const ExportedApp = process.env.NODE_ENV === 'development' ? hot(App) : App;

export default ExportedApp;
export { commandsManager, extensionManager, hotkeysManager, servicesManager };
