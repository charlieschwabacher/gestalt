import React from 'react';
import {IndexRoute, Route} from 'react-router';
import App from './components/App';
import {Home, Post, UserProfile} from './components/scenes';
import {node, session} from './queries';

export default (
  <Route
    path="/"
    component={App}
    queries={session}
  >
    <IndexRoute
      component={Home}
      queries={session}
    />
    <Route
      path="posts/:id"
      component={Post}
      queries={node}
    />
    <Route
      path="users/:id"
      component={UserProfile}
      queries={node}
    />
  </Route>
);
