import React from 'react';

import mail_icon from '../static/mail_icon.png';
import geo_icon from '../static/geo_icon.png';
import nav_logo from '../static/logo_white.svg';

function Footer() {
  return (
    <div className="footer-block">
      <div className="footer-left">
        <img className="navbar-logo" src={nav_logo} alt="Boundless Software Logo" />
        <p className="footer-light-text">© All rights reserved 2020</p>
      </div>
      <div className="footer-middle">
        <img className="footer-mail-icon" src={mail_icon} alt="Mail Icon" />
        <div className="empty-space"></div>
        <a className="footer-text" href="mailto:anthony@boundsoft.dev">anthony@boundsoft.dev</a>
        <img className="footer-geo-icon" src={geo_icon} alt="Location Icon" />
        <div className="empty-space"></div>
        <p className="footer-text">Built in Austin</p>
      </div>
      <div className="footer-right">
        <a href="/" className="footer-right-link">Home</a>
        <a href="/about-us" className="footer-right-link">About Us</a>
        <a href="/for-applicants" className="footer-right-link">For Applicants</a>
        <a href="/contact" className="footer-right-link">Contact Us</a>
      </div>
    </div>
  );
}

export { Footer };
