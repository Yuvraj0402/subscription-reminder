
import { auth, db } from "./firebase-config.js";
import {
    createUserWithEmailAndPassword,
    setPersistence,
    browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const form = document.getElementById("signupForm");
const message = document.getElementById("message");
const button = document.getElementById("signupButton");

form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    message.textContent = "";
    button.disabled = true;

    try {
        await setPersistence(auth, browserSessionPersistence);

        const result = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        await setDoc(doc(db, "users", result.user.uid), {
            name,
            email,
            createdAt: serverTimestamp()
        });

        message.textContent = "Account created successfully!";
        message.style.color = "green";

        window.location.replace("/subscriptions");
    } catch (error) {
        console.error("Signup error:", error);
        message.textContent = error.message;
        message.style.color = "red";
    } finally {
        button.disabled = false;
    }
});
