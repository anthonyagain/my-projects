import React, { useState } from 'react';
import Input from '../components/Form/Input';
import '../styles/pages/login.css';

const Login = () => {
    const [form, setForm] = useState({
        fields: {
            username: '',
            password: '',
        },
        errors: {}
    });


    const handleValidation = () => {
        const fields = form.fields;
        let errors = {};
        let formIsValid = true;

        //UserName
        if (!fields["username"]) {
            formIsValid = false;
            errors["username"] = "Cannot be empty";
        }

        // Password
        if (!fields["password"]) {
            formIsValid = false;
            errors["password"] = "Cannot be empty";
        }

        setForm({ ...form, errors: errors });
        return formIsValid;
    }

    const formSubmit = (e) => {
        e.preventDefault();

        if (handleValidation()) {
            alert("Form submitted");
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
            <div className="login-page">
                <div className="login-page-content">
                    <h1>Login</h1>

                    <form className="login-form" onSubmit={formSubmit}>
                        <Input
                            className="form-group"
                            labelText="Username"
                            type="text"
                            name="username"
                            onChange={handleChange}
                            value={form.fields.username}
                            required
                            placeholder="Example"
                        />
                        <Input
                            className="form-group"
                            type="password"
                            name="password"
                            onChange={handleChange}
                            value={form.fields.password}
                            required
                            placeholder="example"
                        />
                        <div className="login-form-error">{form.errors.form}</div>
                        <button className="login-submit" type="submit">Login</button>
                    </form>
                </div>

            </div>
        </div>
    )
}

export default Login;
