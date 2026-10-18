
import { auth } from "./firebase-config.js";
import {
    signInWithEmailAndPassword,
    setPersistence,
    browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const form = document.getElementById("loginForm");
const message = document.getElementById("message");
const button = document.getElementById("loginButton");

form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    message.textContent = "";
    button.disabled = true;

    try {
        await setPersistence(auth, browserSessionPersistence);

        await signInWithEmailAndPassword(auth, email, password);

        message.textContent = "Login successful!";
        message.style.color = "green";

        window.location.replace("/subscriptions");
    } catch (error) {
        console.error("Login error:", error);
        message.textContent = error.message;
        message.style.color = "red";
    } finally {
        button.disabled = false;
    }
});
