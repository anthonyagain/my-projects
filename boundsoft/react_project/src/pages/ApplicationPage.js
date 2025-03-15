import React, { useState } from 'react';

import { NavigationBar } from '../components/navbar';
import { Footer } from '../components/footer';
import { FormBuilder } from '../components/formBuilder';

import { axios } from '../utilities/axios';

function isNotEmptyString(inputStr) {
  return (typeof inputStr === "string" && inputStr !== "");
}

function ApplicationPage() {

  let fields = [
    {
      "id": "name",
      "type": "string",
      "validation": [isNotEmptyString],
      "text": "Full Name",
      "placeholder": "Jane Doe"
    },
    {
      "id": "email",
      "type": "string",
      "validation": [isNotEmptyString],
      "text": "Email",
      "placeholder": "anthony@boundsoft.dev"
    },
    {
      "id": "is_student",
      "type": "yes/no",
      "validation": [isNotEmptyString],
      "text": "Are you a student?"
    },
    {
      "id": "school",
      "type": "string",
      "validation": [isNotEmptyString],
      "dependencies": {"is_student": "yes"},
      "text": "What school are you attending?",
      "placeholder": "UT Austin"
    },
    {
      "id": "major",
      "type": "string",
      "validation": [isNotEmptyString],
      "dependencies": {"is_student": "yes"},
      "text": "Intended major and minor (if any)",
      "placeholder": "Computer Science"
    },
    {
      "id": "graduation_date",
      "type": "string",
      "validation": [isNotEmptyString],
      "dependencies": {"is_student": "yes"},
      "text": "Expected graduation date (year and semester)",
      "placeholder": "Spring 2024"
    },
    {
      "id": "why_hire",
      "type": "textField",
      "validation": [isNotEmptyString],
      "text": "Why should we hire you?",
    }
  ];

  let [submitted, setSubmitted] = useState(false);
  let [hasError, setError] = useState(false);

  function submitForm(validatedFormData) {
    axios.post("/join-us-submit/", validatedFormData).then(() => {
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
          <h2 className="h2-2">Boundless Software Application</h2>
          {!submitted && (<>
              <FormBuilder fields={fields} submitFunc={submitForm} />
              {hasError && (<p className="error-message">Sorry, an error occurred when trying to submit.</p>)}
            </>)}
          {submitted && (<>
            <p className="submitted-text">Thanks for the application!</p>
            <p className="submitted-text">We'll get back to you by email within
            1-2 weeks if we are interested in moving forward.</p>
          </>)}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default ApplicationPage;
