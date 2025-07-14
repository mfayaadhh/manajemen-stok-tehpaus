""// script.js - untuk routing login

document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const role = document.getElementById('role').value;
    if (role === "admin") {
        window.location.href = "admin-dashboard.html";
    } else if (role === "user") {
        window.location.href = "user-dashboard.html";
    }
});""