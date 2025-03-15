import React from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Register from './pages/Register';
import './styles/global.css';
import Login from './pages/Login';

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/" component={HomePage} exact={true} />
        <Route path="/register" component={Register} exact={true} />
        <Route path="/login" component={Login} exact={true} />
      </Switch>
    </BrowserRouter>
  );
}

export default App;
