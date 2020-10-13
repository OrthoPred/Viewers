import React, { Component } from 'react';
import { I18nextProvider } from 'react-i18next';
import PropTypes from 'prop-types'; //Runtime type checking for React props and similar objects.
import { Provider } from 'react-redux';
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
} from '@ohif/core';

import { initWebWorkers } from './utils/index.js';
import ViewerLocalFileData from './connectedComponents/ViewerLocalFileData';
import { getActiveContexts } from './store/layout/selectors.js';
import store from './store';
import { AppProvider, useAppContext, CONTEXTS } from './context/AppContext';

/** ~~~~~~~~~~~~~ Application Setup */
const commandsManagerConfig = {
  getAppState: () => store.getState(),
  getActiveContexts: () => getActiveContexts(store.getState()),
};

const commandsManager = new CommandsManager(commandsManagerConfig);
const servicesManager = new ServicesManager();
const hotkeysManager = new HotkeysManager(commandsManager, servicesManager);
let extensionManager;
/** ~~~~~~~~~~~~~ End Application Setup */

// TODO[react] Use a provider when the whole tree is React
window.store = store;

class App extends Component {
  static propTypes = {
    config: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.shape({
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

  constructor(props) {
    super(props);

    const { config, defaultExtensions } = props;

    const appDefaultConfig = {
      showStudyList: false,
      cornerstoneExtensionConfig: {},
      extensions: [],
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

    _initServices([UINotificationService, UIModalService, UIDialogService]);
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
    const {
      UINotificationService,
      UIDialogService,
      UIModalService,
    } = servicesManager.services;

    return (
      <ErrorBoundary context="App">
        <Provider store={store}>
          <AppProvider config={this._appConfig}>
            <I18nextProvider i18n={i18n}>
              {' '}
              {/*I18next is an internationalization-framework */}
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
  // console.log('init services: ', services);
  servicesManager.registerServices(services);
  // console.log('registered: ', servicesManager);
}

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
    [OHIFCornerstoneExtension, cornerstoneExtensionConfig],
  ];
  extensionManager.registerExtensions(requiredExtensions);
}

/**
 *
 * @param {Object} appConfigHotkeys - Default hotkeys, as defined by app config
 */
function _initHotkeys(appConfigHotkeys) {
  const userPreferredHotkeys = JSON.parse(
    localStorage.getItem('hotkey-definitions') || '{}'
  );

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
