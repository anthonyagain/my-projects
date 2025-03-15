import React, { useState } from 'react';

import nav_logo from '../static/logo_white.svg';
import menu_icon from '../static/menu-icon.svg';
import close_icon from '../static/close-icon.svg';

function NavigationBarLinks() {
  return (
    <>
      <a className="navbar-link" href="/about-us">About Us</a>
      <a className="navbar-link" href="/for-applicants">For Applicants</a>
      <a className="navbar-link" href="/contact">Contact Us</a>
      <a className="navbar-button" href="/apply">
        <p className="navbar-button-text">Join Us</p>
      </a>
    </>
  );
}

function NavigationBar() {

  const [menuOpen, setMenuOpen] = useState(false);

  let showDropdown;
  if(menuOpen)
    showDropdown = "";
  else
    showDropdown = "hide-me";

  return (
    <div className="navbar">
      <div className="navbar-top">
        <div className="empty-space"></div>
        <a href="/">
          <img className="navbar-logo" src={nav_logo} alt="Boundless Software Logo"/>
        </a>
        <div className="empty-space"></div>
        <div className="navbar-link-container-desktop">
          <NavigationBarLinks />
        </div>
        <div className="navbar-hamburger-button-mobile">
          <img hidden={menuOpen} onClick={() => setMenuOpen(true)} src={menu_icon} />
          <img hidden={!menuOpen} onClick={() => setMenuOpen(false)} src={close_icon} />
        </div>
        <div className="empty-space"></div>
      </div>
      <div className={`navbar-dropdown ${showDropdown}`}>
        <NavigationBarLinks />
      </div>
    </div>
  );
}

export { NavigationBar };
