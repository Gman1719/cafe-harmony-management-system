// ================================
// MARKAN CAFE USER SYSTEM
// ================================

// Load users from localStorage or JSON
function loadUsers() {
    let users = localStorage.getItem("markanUsers");
    if (users) {
        return JSON.parse(users);
    } else {
        // Default admin user
        const defaultUsers = [
            {
                id: 1,
                name: "Admin User",
                email: "admin@markancafe.com",
                phone: "+251900000000",
                password: "Admin@123",
                role: "admin"
            }
        ];
        localStorage.setItem("markanUsers", JSON.stringify(defaultUsers));
        return defaultUsers;
    }
}

// Save users to localStorage
function saveUsers(users) {
    localStorage.setItem("markanUsers", JSON.stringify(users));
}

// Generate ID
function generateUserId(users) {
    return users.length > 0 ? users[users.length - 1].id + 1 : 1;
}

// ================================
// REGISTER FUNCTION
// ================================
function registerUser(event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const role = document.getElementById("role").value;

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    let users = loadUsers();

    // Check if email already exists
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
        alert("Email already registered!");
        return;
    }

    const newUser = {
        id: generateUserId(users),
        name,
        email,
        phone,
        password,
        role
    };

    users.push(newUser);
    saveUsers(users);

    alert("Registration successful! Please login.");
    window.location.href = "login.html";
}

// ================================
// LOGIN FUNCTION
// ================================
function loginUser(event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    let users = loadUsers();

    const user = users.find(
        user => user.email === email && user.password === password
    );

    if (!user) {
        alert("Invalid email or password!");
        return;
    }

    // Store logged in user
    localStorage.setItem("markanCurrentUser", JSON.stringify(user));

    alert("Login successful!");

    if (user.role === "admin") {
        window.location.href = "admin/dashboard.html";
    } else {
        window.location.href = "customer/dashboard.html";
    }
}

// ================================
// CHECK LOGIN STATUS
// ================================
function checkAuth() {
    const user = JSON.parse(localStorage.getItem("markanCurrentUser"));
    if (!user) {
        window.location.href = "login.html";
    }
}

// ================================
// LOGOUT FUNCTION
// ================================
function logoutUser() {
    localStorage.removeItem("markanCurrentUser");
    window.location.href = "../login.html";
}

// ================================
// ATTACH FORMS
// ================================
document.addEventListener("DOMContentLoaded", function () {
    const registerForm = document.getElementById("registerForm");
    const loginForm = document.getElementById("loginForm");

    if (registerForm) {
        registerForm.addEventListener("submit", registerUser);
    }

    if (loginForm) {
        loginForm.addEventListener("submit", loginUser);
    }
});