import React from 'react';

import nav_logo from '../static/logo_white.svg';
import home_block2_right from '../static/home_block2-1.png';
import home_block2_left from '../static/home_block2-2.png';

import { NavigationBar } from '../components/navbar';
import { Footer } from '../components/footer';

function BuildingTheFutureText() {
  return (
    <div className="text-block">
      <h1 className="h1-1">Building the future, one step at a time</h1>
      <h2 className="h2-1">What we do</h2>
      <p className="p-1">
        We are a small startup building mobile and web applications
        based out of Austin, Texas. Our mission is to build software
        that makes the world a better place by adding value to our
        users' lives. We want to educate, inform, and build tools that
        simplify the challenges of everyday life.
      </p>
    </div>
  );
}

function BuildingTheFutureImage() {
  return (
      <div className="home-block2-img-wrapper">
        <img className="home-block2-img" src={home_block2_left} />
      </div>
  );
}

function GreatTeamText() {
  return (
    <div className="text-block">
      <h1 className="h1-1">Great products powered by a great team</h1>
      <h2 className="h2-1">Our values</h2>
      <p className="p-1">
        We know that to build a great product, you have to have
        great people - so we strive to foster a pro-employee culture
        where we give our employees flexibility with their schedule,
        independence so that they can build great things, and
        mentorship so that they can grow their skills along the way.
      </p>
    </div>
  );
}

function GreatTeamImage() {
  return (
    <div className="home-block2-img-wrapper">
      <img className="home-block2-img" src={home_block2_right} />
    </div>
  );
}

function HomePage() {
  return (
    <div className="homepage">
      <NavigationBar />
      <div className="main-content">
        <div className="block-1">
          <div className="empty-space"></div>
          <img className="block-1-header" src={nav_logo} alt="Boundless Software"/>
          <div className="block-1-subheader">
            Startup building mobile and web applications based out of Austin, Texas.
          </div>
          <div className="empty-space"></div>
        </div>
        <div className="block-2-desktop">
          <div className="block-2-section-left">
            <div className="empty-space"></div>
            <BuildingTheFutureText />
            <div className="empty-space"></div>
            <BuildingTheFutureImage />
            <div className="empty-space"></div>
          </div>
          <div className="block-2-section-right">
            <div className="empty-space"></div>
            <GreatTeamImage />
            <div className="empty-space"></div>
            <GreatTeamText />
            <div className="empty-space"></div>
          </div>
        </div>
        <div className="block-2-mobile">
          <BuildingTheFutureImage />
          <BuildingTheFutureText />
          <GreatTeamImage />
          <GreatTeamText />
        </div>
        <div className="block-3">
          <div className="empty-space"></div>
          <a href="/apply">
            <button className="join-us-button">JOIN US</button>
          </a>
          <div className="empty-space"></div>
          <p className="home-lower-text">
            Boundless Software is hiring! We are looking for quick learners
            with a passion for building quality products.
          </p>
          <div className="empty-space"></div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default HomePage;
