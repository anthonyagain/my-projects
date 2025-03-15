import React from 'react';
import { useHistory } from 'react-router-dom';
import './death-ui.css';

const RegisterOrLogin = ({ socket }) => {
    const history = useHistory();

    return (
        <div className="death-ui-register">
            <div className="death-ui-register-text">
                You have earned <strong>17 gold</strong> during this round, create an account or login to save your reward
          </div>
            <div className="death-ui-register-controls">
                <button className="death-ui-register-button"
                    onClick={() => {
                        socket.onclose = null;
                        socket.close();
                        history.push('/register');
                    }}>
                    Register
        </button>
                <button className="death-ui-register-button death-ui-register-button-blue"
                    onClick={() => {
                        socket.onclose = null;
                        socket.close();
                        history.push('/login');
                    }}>
                    Login
        </button>
            </div>
        </div>
    )
}

export default RegisterOrLogin;
