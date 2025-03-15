import React, { useState } from 'react';

function FormBuilder({fields, submitFunc}) {
  /*
  The code for this component is kind of garbage.
  */
  let formJSX = [];

  let [formState, setFormState] = useState({});

  // Construct a new form state to modify each call
  let newFormState = {...formState};

  for(let i = 0; i < fields.length; i++) {
    let field = fields[i];
    let shouldRenderField = true;
    let dependencyClass = "";

    if(field["dependencies"]) {
      for(let [key, value] of Object.entries(field["dependencies"])) {
        dependencyClass = "dependency";
        if(!(newFormState[key] == value)) {
          shouldRenderField = false;
        }
      }
    }
    if(shouldRenderField) {
      formJSX.push(
        <label key={field["id"] + "-l"} htmlFor={field["id"]} className={dependencyClass}>{field["text"]}</label>
      );
      if(newFormState[field["id"]] == undefined) {
        newFormState[field["id"]] = "";
      }
      if(field["type"] === "string") {
        formJSX.push(
          <input
            key={field["id"]}
            type="text"
            id={field["id"]}
            name={field["id"]}
            value={newFormState[field["id"]]}
            className={dependencyClass}
            placeholder={field["placeholder"]}
            required={field["validation"]}
            onChange={(event) => {
              newFormState[field["id"]] = event.target.value;
              setFormState(newFormState);
            }}
          />
        );
      }
      else if(field["type"] === "yes/no") {
        formJSX.push(
          <div key={field["id"]}>
            <input
              type="radio"
              id={"yes"}
              name={field["id"]}
              value={newFormState[field["id"]]}
              required={field["validation"]}
              onChange={(event) => {
                newFormState[field["id"]] = event.target.id;
                setFormState(newFormState);
              }}
            />
            <label htmlFor={field["id"]} className="form-label">Yes</label>
            <input
              type="radio"
              id={"no"}
              name={field["id"]}
              value={newFormState[field["id"]]}
              required={field["validation"]}
              onChange={(event) => {
                newFormState[field["id"]] = event.target.id;
                setFormState(newFormState);
              }}
            />
            <label htmlFor={field["id"]} className="form-label">No</label>
          </div>
        );
      }
      else if(field["type"] == "textField") {
        formJSX.push(
          <textarea
            key={field["id"]}
            type="text"
            id={field["id"]}
            name={field["id"]}
            value={newFormState[field["id"]]}
            required={field["validation"]}
            onChange={(event) => {
              newFormState[field["id"]] = event.target.value;
              setFormState(newFormState);
            }}
          />
        );
      }
    }
  }

  return (
    <form onSubmit={(event) => { event.preventDefault(); submitFunc(formState); }}>
      { formJSX }
      <button type="submit" className="form-submit-button">Submit</button>
    </form>
  );

}

export { FormBuilder }
