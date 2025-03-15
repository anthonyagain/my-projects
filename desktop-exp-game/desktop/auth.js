let loginForm = document.getElementById("loginForm");
let login_error = document.getElementById("login_error");
let adminemail = document.getElementById("adminemail");
let uname = document.getElementById("uname");
let psw = document.getElementById("psw");
let remember = document.getElementById("remember");

loginForm.onsubmit = function (e) {
  e.preventDefault();

  const email = adminemail.value;
  const username = uname.value;
  const password = psw.value;
  const rememberme = remember.checked;

  signin({ email, username, password, rememberme }).then((data) => {
    if (data.error || data.err) {
      login_error.innerHTML = data.error || data.err;
    } else {
      authenticate(data, () => {
        console.log("success", data);
        window.location.reload();
      });
    }
  });
};

const authenticate = (data, next) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("jwt", JSON.stringify(data));
    next();
  }
};

const signin = (user) => {
  return fetch(`${API}/employees/employee/signin`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },

    body: JSON.stringify(user),
  })
    .then((responce) => {
      return responce.json();
    })
    .catch((err) => {
      console.log(err);
    });
};
