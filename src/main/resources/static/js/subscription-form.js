
import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    addDoc,
    collection,
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const form = document.getElementById("subscriptionForm");
const message = document.getElementById("message");
const saveButton = document.getElementById("saveButton");

const heading = document.getElementById("formHeading");
const panelHeading = document.getElementById("panelHeading");

const serviceNameInput = document.getElementById("serviceName");
const costInput = document.getElementById("cost");
const billingCycleInput = document.getElementById("billingCycle");
const renewalDateInput = document.getElementById("renewalDate");
const notesInput = document.getElementById("notes");

const params = new URLSearchParams(window.location.search);
const editId = params.get("id");

let currentUser = null;
let authReady = false;
let formLoaded = false;

function showMessage(text, isError = false) {
    message.textContent = text;
    message.classList.remove("hidden", "error");

    if (isError) {
        message.classList.add("error");
    }
}

function setFormEnabled(enabled) {
    for (const element of form.elements) {
        element.disabled = !enabled;
    }
}

function setEditMode() {
    heading.textContent = "Update your subscription.";
    panelHeading.textContent = "Edit subscription";
    saveButton.textContent = "Save changes →";
}

async function loadSubscription() {
    if (!currentUser || !editId || formLoaded) return;

    formLoaded = true;
    setFormEnabled(false);
    showMessage("Loading subscription details...");

    try {
        const reference = doc(
            db,
            "users",
            currentUser.uid,
            "subscriptions",
            editId
        );

        const snapshot = await getDoc(reference);

        if (!snapshot.exists()) {
            showMessage(
                "This subscription was not found or you do not have access to it.",
                true
            );
            return;
        }

        const data = snapshot.data();

        serviceNameInput.value = data.name || "";
        costInput.value = data.cost ?? "";
        billingCycleInput.value = data.billingCycle || "Monthly";
        renewalDateInput.value = data.renewalDate || "";
        notesInput.value = data.notes || "";

        setEditMode();
        message.classList.add("hidden");
    } catch (error) {
        console.error("Could not load subscription:", error);
        showMessage("Unable to load subscription details.", true);
    } finally {
        setFormEnabled(true);
    }
}

onAuthStateChanged(auth, async user => {
    authReady = true;

    if (!user) {
        window.location.replace("/login");
        return;
    }

    currentUser = user;

    if (editId) {
        await loadSubscription();
    } else {
        setFormEnabled(true);
    }
});

form.addEventListener("submit", async event => {
    event.preventDefault();

    if (!authReady || !currentUser) {
        showMessage("Please wait while your account is being checked.", true);
        return;
    }

    const name = serviceNameInput.value.trim();
    const cost = Number(costInput.value);
    const billingCycle = billingCycleInput.value;
    const renewalDate = renewalDateInput.value;
    const notes = notesInput.value.trim();

    if (!name) {
        showMessage("Please enter a service name.", true);
        return;
    }

    if (!Number.isFinite(cost) || cost <= 0) {
        showMessage("Enter a price greater than zero.", true);
        return;
    }

    if (!["Monthly", "Yearly", "Weekly"].includes(billingCycle)) {
        showMessage("Please select a valid billing cycle.", true);
        return;
    }

    if (!renewalDate) {
        showMessage("Please select the next renewal date.", true);
        return;
    }

    const data = {
        name,
        cost,
        billingCycle,
        renewalDate,
        notes,
        active: true,
        updatedAt: new Date().toISOString()
    };

    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    try {
        const subscriptionsRef = collection(
            db,
            "users",
            currentUser.uid,
            "subscriptions"
        );

        if (editId) {
            const reference = doc(
                db,
                "users",
                currentUser.uid,
                "subscriptions",
                editId
            );

            // Do not overwrite an existing subscription's creation time.
            await updateDoc(reference, data);
        } else {
            await addDoc(subscriptionsRef, {
                ...data,
                createdAt: new Date().toISOString()
            });
        }

        window.location.replace("/subscriptions");
    } catch (error) {
        console.error("Could not save subscription:", error);
        showMessage(
            "Unable to save. Check your Firestore rules and internet connection.",
            true
        );
        saveButton.disabled = false;
        saveButton.textContent = editId
            ? "Save changes →"
            : "Save subscription →";
    }
});
