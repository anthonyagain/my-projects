import React from 'react';

import { NavigationBar } from '../components/navbar';
import { Footer } from '../components/footer';

function AboutUsPage() {
  return (
    <div className="application-page">
      <NavigationBar />
      <div className="application-page-content">
        <div className="application-page-form">
          <h2 className="h2-2">About Us</h2>
          <p className="p-2">Boundless Software is a small software company
          that is based out of Austin, Texas.</p>
          <p className="p-2">We have a few different projects that are underway
          at present. Our strategy is to quickly iterate over different software
          products until we hit on something with a strong product-market fit
          that we can focus more heavily on and grow the company with.</p>
          <p className="p-2">Our goal is to build solutions that provide value
          to people and to other businesses. We believe that success can
          only come by serving others, and so we pay extremely close attention
          to our customers' needs and take feedback seriously.</p>
          <p className="p-2">If you have a software idea you'd like us to build for
          you or your business, <a href="/contact">send us a message!</a> We'll
          look at your idea, and if we see potential in it being useful to a
          broader audience, we will build it for free. Note: We would develop and
          own the software, but it would be available to you for use at little
          to no cost. We are not interested in paid software contracts at this
          time (with rare exceptions).</p>
          <p className="p-2">We're starting small, but we have big ambitions.
          We hope that one day we can build products and services that positively
          impact hundreds of millions of people and make the world a better place
          for each of them.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default AboutUsPage;
