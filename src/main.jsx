/**
 * This is the entry point to the app
 */
import './styles/main.less';

import React from 'react';
import { render } from 'react-dom'; // <--- 关键：必须引入 render
import { Router, Route, browserHistory } from 'react-router';

// 页面组件导入
import WelcomePage from './welcome';
import GalaxyPage from './galaxy/galaxyPage.jsx';
import DocsPage from './DocsPage.jsx'; // 文档页

render(
  <Router history={browserHistory}>
    <Route path='/' component={WelcomePage}/>
    <Route path='/galaxy/:name' component={GalaxyPage} />
    <Route path='/docs' component={DocsPage} />
  </Router>,
  document.getElementById('app')
);