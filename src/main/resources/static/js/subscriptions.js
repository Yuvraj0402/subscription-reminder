
import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    collection,
    getDocs,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const list = document.getElementById("subscriptionList");
const emptyState = document.getElementById("emptyState");
const message = document.getElementById("message");

const totalElement = document.getElementById("totalSubscriptions");
const monthlyElement = document.getElementById("monthlyTotal");
const upcomingElement = document.getElementById("upcomingTotal");

const userNameElement = document.getElementById("userName");
const avatarElement = document.getElementById("userAvatar");
const logoutButton = document.getElementById("logoutButton");

let currentUser = null;

function showMessage(text, isError = false) {
    message.textContent = text;
    message.classList.remove("hidden", "error");

    if (isError) {
        message.classList.add("error");
    }
}

function money(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(amount);
}

function monthlyCost(subscription) {
    const cost = Number(subscription.cost) || 0;

    switch (subscription.billingCycle) {
        case "Yearly":
            return cost / 12;
        case "Weekly":
            return cost * 52 / 12;
        default:
            return cost;
    }
}

function formatDate(dateString) {
    if (!dateString) return "Not specified";

    const date = new Date(`${dateString}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return "Not specified";
    }

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function daysUntil(dateString) {
    if (!dateString) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const renewal = new Date(`${dateString}T00:00:00`);

    if (Number.isNaN(renewal.getTime())) return null;

    return Math.round((renewal - today) / (1000 * 60 * 60 * 24));
}

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function serviceSymbol(name) {
    const cleaned = String(name || "").trim();
    return cleaned ? escapeHTML(cleaned.charAt(0).toUpperCase()) : "S";
}

async function loadSubscriptions() {
    if (!currentUser) return;

    list.innerHTML = '<div class="loading-state">Loading your subscriptions...</div>';
    emptyState.classList.add("hidden");

    try {
        const subscriptionsRef = collection(
            db,
            "users",
            currentUser.uid,
            "subscriptions"
        );

        const snapshot = await getDocs(subscriptionsRef);

        const subscriptions = snapshot.docs.map(item => ({
            id: item.id,
            ...item.data()
        }));

        // Newest first, using the renewal date as a secondary ordering.
        subscriptions.sort((a, b) => {
            const dateA = a.createdAt || "";
            const dateB = b.createdAt || "";

            return dateB.localeCompare(dateA) ||
                String(a.renewalDate || "").localeCompare(
                    String(b.renewalDate || "")
                );
        });

        const activeSubscriptions = subscriptions.filter(
            item => item.active !== false
        );

        const totalMonthly = activeSubscriptions.reduce(
            (sum, item) => sum + monthlyCost(item),
            0
        );

        const upcoming = activeSubscriptions.filter(item => {
            const days = daysUntil(item.renewalDate);
            return days !== null && days >= 0 && days <= 7;
        }).length;

        totalElement.textContent = activeSubscriptions.length;
        monthlyElement.textContent = money(totalMonthly);
        upcomingElement.textContent = upcoming;

        if (activeSubscriptions.length === 0) {
            list.innerHTML = "";
            emptyState.classList.remove("hidden");
            return;
        }

        emptyState.classList.add("hidden");

        list.innerHTML = activeSubscriptions.map(item => {
            const days = daysUntil(item.renewalDate);
            let renewalText = formatDate(item.renewalDate);
            let renewalClass = "";

            if (days === 0) {
                renewalText += " · Today";
                renewalClass = "renewal-soon";
            } else if (days === 1) {
                renewalText += " · Tomorrow";
                renewalClass = "renewal-soon";
            } else if (days !== null && days > 1 && days <= 7) {
                renewalText += ` · In ${days} days`;
                renewalClass = "renewal-soon";
            } else if (days !== null && days < 0) {
                renewalText += " · Past date";
            }

            const cycle = escapeHTML(item.billingCycle || "Monthly");
            const cost = Number(item.cost) || 0;

            return `
                <article class="subscription-card">
                    <div class="subscription-card-top">
                        <div class="service-icon">${serviceSymbol(item.name)}</div>
                        <div class="service-main">
                            <h3>${escapeHTML(item.name || "Unnamed service")}</h3>
                            <span class="cycle-label">${cycle} billing</span>
                        </div>
                    </div>

                    <div class="subscription-price">
                        ${money(cost)}
                        <small>/ ${cycle.toLowerCase()}</small>
                    </div>

                    <div class="renewal-row">
                        <span>Next renewal</span>
                        <strong class="${renewalClass}">${escapeHTML(renewalText)}</strong>
                    </div>

                    ${item.notes ? `
                        <p class="card-notes">${escapeHTML(item.notes)}</p>
                    ` : ""}

                    <div class="card-actions">
                        <button
                            type="button"
                            class="btn-small"
                            data-action="edit"
                            data-id="${escapeHTML(item.id)}"
                        >Edit</button>
                        <button
                            type="button"
                            class="btn-small danger"
                            data-action="delete"
                            data-id="${escapeHTML(item.id)}"
                        >Delete</button>
                    </div>
                </article>
            `;
        }).join("");

    } catch (error) {
        console.error("Could not load subscriptions:", error);
        list.innerHTML = "";
        showMessage(
            "Could not load subscriptions. Check your internet connection and Firestore rules.",
            true
        );
    }
}

list.addEventListener("click", async event => {
    const button = event.target.closest("button[data-action]");
    if (!button || !currentUser) return;

    const id = button.dataset.id;
    const action = button.dataset.action;

    if (!id) return;

    if (action === "edit") {
        window.location.href =
            `/subscription-form?id=${encodeURIComponent(id)}`;
        return;
    }

    if (action === "delete") {
        const confirmed = window.confirm(
            "Are you sure you want to delete this subscription?"
        );

        if (!confirmed) return;

        button.disabled = true;

        try {
            await deleteDoc(
                doc(db, "users", currentUser.uid, "subscriptions", id)
            );

            showMessage("Subscription deleted successfully.");
            await loadSubscriptions();
        } catch (error) {
            console.error("Delete failed:", error);
            showMessage("Unable to delete this subscription.", true);
            button.disabled = false;
        }
    }
});

logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;

    try {
        await signOut(auth);
        window.location.replace("/login");
    } catch (error) {
        console.error("Sign out failed:", error);
        showMessage("Could not sign out. Please try again.", true);
        logoutButton.disabled = false;
    }
});

onAuthStateChanged(auth, async user => {
    if (!user) {
        window.location.replace("/login");
        return;
    }

    currentUser = user;

    const displayName = user.displayName ||
        (user.email ? user.email.split("@")[0] : "User");

    userNameElement.textContent = displayName;
    avatarElement.textContent = displayName.charAt(0).toUpperCase();

    await loadSubscriptions();
});
