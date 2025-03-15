import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Switch, Route, Link } from 'react-router-dom';

import './App.css';

const HomePage = React.lazy(() => import('./pages/HomePage'));
const ApplicationPage = React.lazy(() => import('./pages/ApplicationPage'));
const ContactUsPage = React.lazy(() => import('./pages/ContactUsPage'));
const AboutUsPage = React.lazy(() => import('./pages/AboutUsPage'));
const ForApplicantsPage = React.lazy(() => import('./pages/ForApplicantsPage'));

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/" exact={true} render={() => <Loading c={HomePage} />} />
        <Route path="/apply/" exact={true} render={() => <Loading c={ApplicationPage} />} />
        <Route path="/contact/" exact={true} render={() => <Loading c={ContactUsPage} />} />
        <Route path="/about-us/" exact={true} render={() => <Loading c={AboutUsPage} />} />
        <Route path="/for-applicants/" exact={true} render={() => <Loading c={ForApplicantsPage} />} />
        <Route component={PageNotFound} />
      </Switch>
    </BrowserRouter>
  );
}

function Loading(props) {
  let Component = props.c;
  return (
    <Suspense fallback={<div></div>}>
      <Component />
    </Suspense>
  );
}

function PageNotFound() {
  return (
    <div>
      Sorry, page not found.
    </div>
  );
}

export default App;
