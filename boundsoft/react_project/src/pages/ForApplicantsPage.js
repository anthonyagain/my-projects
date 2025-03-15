import React from 'react';

import { NavigationBar } from '../components/navbar';
import { Footer } from '../components/footer';

function ForApplicantsPage() {
  return (
    <div className="application-page">
      <NavigationBar />
      <div className="application-page-content">
        <div className="application-page-form">
          <h2 className="h2-2">For Applicants</h2>
          <h3 className="h3-1">What positions are available?</h3>
          <p className="p-2 first-p">For long-term positions on the team, we are
          currently only hiring developers. Design work is available on a contractual
          basis.</p>
          <p className="p-2">We are hiring both full-time staff and students
          (we are looking for students who want to work during the academic year).
          For students, pay is $15/hour, and for full-time staff, pay is
          negotiable but funding is limited. Equity is available.</p>
          <h3 className="h3-1">Why should I work at Boundless Software?</h3>
          <p className="p-2 first-p">
            <ul>
              <li>Use modern technologies to build full-stack mobile and web applications</li>
              <li>Get direct one-on-one mentorship to grow your skills as a developer</li>
              <li>Flexible working hours - work around your own schedule</li>
              <li>Do work that benefits others in meaningful ways</li>
              <li>Able to influence the direction of the product and company</li>
              <li>Bonuses based on performance</li>
            </ul>
          </p>
          <h3 className="h3-1">What are you looking for in an applicant?</h3>
          <p className="p-2 first-p">We are looking for developers that are able to think
          on their feet, learn new things quickly, and are passionate about
          writing good code and building high-quality products. There are no
          hard requirements - we are looking for aptitude more than anything
          else.</p>
          <p className="p-2">If that sounds like you, send us an application!</p>
          <div className="for-applicants-join-us">
            <a href="/apply">
              <button className="join-us-button-2">Join Us</button>
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default ForApplicantsPage;
