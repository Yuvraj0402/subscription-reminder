
import { auth } from "./firebase-config.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

export async function signup(email, password) {
    return await createUserWithEmailAndPassword(
        auth, email, password
    );
}

export async function login(email, password) {
    return await signInWithEmailAndPassword(
        auth, email, password
    );
}

export async function logout() {
    return await signOut(auth);
}
