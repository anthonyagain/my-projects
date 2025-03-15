import { isDevelopment } from './misc';

function getCSRFToken() {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        let cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            if (cookie.substring(0, 10) === 'csrftoken' + '=') {
                cookieValue = decodeURIComponent(cookie.substring(10));
                break;
            }
        }
    }
    if (cookieValue === null) {
        // if (isDevelopment()) {
        //     // you have to navigate to the Django Helm first in order to claim a CSRF token during development.
        //     // if dev site is open on 'localhost' vs '127.0.0.1', django helm must be opened on same one to claim CSRF token
        //     setTimeout(() => {
        //         alert('CSRF token not found during development. Redirecting to Helm to claim a token.');
        //         window.location.href = '/app/helm';
        //     }, 0);
        // } else {
        //     throw 'ERROR: COULD NOT FIND A CSRF TOKEN.';
        // }
        // throw 'ERROR: COULD NOT FIND A CSRF TOKEN.';
        return '';
    }
    return cookieValue;
}

export { getCSRFToken };
