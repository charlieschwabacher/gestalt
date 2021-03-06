import React from 'react';
import ReactDOM from 'react-dom';
import Relay, {DefaultNetworkLayer} from 'react-relay';
import {Router, browserHistory, applyRouterMiddleware} from 'react-router';
import useRelay from 'react-router-relay';
import routes from './routes';

Relay.injectNetworkLayer(
  new DefaultNetworkLayer('/graphql', {
    credentials: 'include',
  })
);

ReactDOM.render(
  <Router
    history={browserHistory}
    routes={routes}
    render={applyRouterMiddleware(useRelay)}
    environment={Relay.Store}
  />,
  document.getElementById('root')
);
