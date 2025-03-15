import React, { useState } from 'react';

import { NavigationBar } from '../components/navbar';
import { Footer } from '../components/footer';
import { FormBuilder } from '../components/formBuilder';

import { axios } from '../utilities/axios';

function isNotEmptyString(inputStr) {
  return (typeof inputStr === "string" && inputStr !== "");
}

function ContactUsPage() {

  let fields = [
    {
      "id": "email",
      "type": "string",
      "validation": [isNotEmptyString],
      "text": "Your email",
      "placeholder": "anthony@boundsoft.dev"
    },
    {
      "id": "message",
      "type": "textField",
      "validation": [isNotEmptyString],
      "text": "Message",
    }
  ];

  let [submitted, setSubmitted] = useState(false);
  let [hasError, setError] = useState(false);

  function submitForm(validatedFormData) {
    axios.post("/contact-us-submit/", validatedFormData).then(() => {
      setSubmitted(true);
    }).catch(() => {
      setError(true);
    });
  }

  return (
    <div className="application-page">
      <NavigationBar />
      <div className="application-page-content">
        <div className="application-page-form">
          {!submitted &&
            <>
              <h2 className="h2-2">Contact Us</h2>
              <FormBuilder fields={fields} submitFunc={submitForm} />
              {hasError && (<p className="error-message">Sorry, an error occurred when trying to submit.</p>)}
            </>}
          {submitted && (<>
            <p className="submitted-text">Your message has been submitted.</p>
          </>)}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default ContactUsPage;
