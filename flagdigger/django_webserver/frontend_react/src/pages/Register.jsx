import React, { useState } from 'react';
import '../styles/pages/register.css';
import { useHistory } from 'react-router-dom';
import Input from '../components/Form/Input';

const Register = () => {
    const history = useHistory();

    const [form, setForm] = useState({
        fields: {
            email: '',
            username: '',
            password: '',
            confirmPassword: '',
        },
        errors: {}
    });

    const [submittedForm, setSubmittedForm] = useState(false);

    const handleValidation = () => {
        const fields = form.fields;
        let errors = {};
        let formIsValid = true;

        //UserName
        if (!fields["username"]) {
            formIsValid = false;
            errors["username"] = "Cannot be empty";
        }

        if (typeof fields["username"] !== "undefined") {
            if (fields["username"].length < 4) {
                formIsValid = false;
                errors["username"] = "Username should be longer than 4 symbols";
            } else if (fields["username"].length > 14) {
                formIsValid = false;
                errors["username"] = "Username should be smaller than 14 symbols";
            }
        }

        //Email
        if (!fields["email"]) {
            formIsValid = false;
            errors["email"] = "Cannot be empty";
        }

        if (typeof fields["email"] !== "undefined") {
            if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(fields["email"])) {
                formIsValid = false;
                errors["email"] = 'Invalid email address';
            }
        }

        // Password
        if (!fields["password"]) {
            formIsValid = false;
            errors["password"] = "Cannot be empty";
        }

        if (typeof fields["password"] !== "undefined") {
            if (fields["password"].length < 4) {
                formIsValid = false;
                errors["password"] = "Password should be longer than 4 symbols";
            } else if (fields["password"].length > 14) {
                formIsValid = false;
                errors["password"] = "Password should be smaller than 14 symbols";
            }
        }

        //Confirm password
        if (!fields["confirmPassword"]) {
            formIsValid = false;
            errors["confirmPassword"] = "Cannot be empty";
        }

        if (typeof fields["confirmPassword"] !== "undefined") {
            if (fields["confirmPassword"] !== fields["password"]) {
                formIsValid = false;
                errors["password"] = "Password and confirm password is not equal";
                errors["confirmPassword"] = "Password and confirm password is not equal";
            }
        }

        setForm({ ...form, errors: errors });
        return formIsValid;
    }

    const formSubmit = (e) => {
        e.preventDefault();

        if (handleValidation()) {
            alert("Form submitted");
            setSubmittedForm(true);
            setTimeout(() => history.push('/login'), 2000);
        } else {
            alert("Form has errors.");
        }

    }

    const handleChange = (event) => {
        const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        form['fields'][event.target.name] = value;
        setForm({
            ...form,
        });
    }

    return (
        <div className="container">
            <div className="register-page">
                <div className="register-page-content">

                    <h1>Create an account</h1>
                    {!submittedForm ? <form className="register-form" onSubmit={formSubmit}>
                        <Input
                            className="form-group"
                            labelText="Username"
                            name="username"
                            type="text"
                            placeholder="Example"
                            required={true}
                            onChange={handleChange}
                            value={form.fields.username}
                            error={form.errors.username}
                        />
                        <Input
                            className="form-group"
                            labelText="Password"
                            type="password"
                            name="password"
                            value={form.fields.password}
                            onChange={handleChange}
                            placeholder="Example"
                            required
                            error={form.errors.password}
                        />
                        <Input
                            className="form-group"
                            labelText="Confirm password"
                            type="password"
                            name="confirmPassword"
                            value={form.fields.confirmPassword}
                            onChange={handleChange}
                            placeholder="Example"
                            required
                            error={form.errors.confirmPassword}
                        />
                        <Input
                            className="form-group"
                            labelText="E-mail"
                            type="email"
                            name="email"
                            placeholder="example@example.com"
                            value={form.fields.email}
                            onChange={handleChange}
                            required
                            error={form.errors.email}
                        />
                        <div className="form-group">
                            <label>
                                <input type="checkbox" className="form-group-checkbox" name="updates" value={form.fields.updates} onChange={handleChange} />
                                <span>I would like to receive occasional emails with free in-game upgrades and game updates</span>
                            </label>
                        </div>
                        <button className="register-submit" type="submit">Submit</button>
                    </form> : <div className="register-success">Thank you for registering, you'll be redirected to login page</div>}
                </div>
            </div>
        </div >
    );
}

export default Register;
