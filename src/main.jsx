/**
 * This is the entry point to the app
 */
import './styles/main.less';

import React from 'react';
import { render } from 'react-dom';
import { Router, Route, browserHistory } from 'react-router';

import WelcomePage from './welcome';
import GalaxyPage from './galaxy/galaxyPage.jsx';
import DocsPage from './DocsPage.jsx';
import i18n from './galaxy/utils/i18n.js';

function renderApp() {
  render(
    <Router history={browserHistory}>
      <Route path='/' component={WelcomePage}/>
      <Route path='/galaxy/:name' component={GalaxyPage} />
      <Route path='/docs' component={DocsPage} />
    </Router>,
    document.getElementById('app')
  );
}

i18n.init().then(renderApp).catch(renderApp);