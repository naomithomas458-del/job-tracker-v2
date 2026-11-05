// ================================
// ADD APPLICATION MODAL
// ================================

const applicationModal = document.getElementById("applicationModal");

const addApplicationBtn = document.getElementById("addApplicationBtn");

const applicationsAddBtn = document.getElementById("applicationsAddBtn");

const closeModalBtn = document.getElementById("closeModalBtn");

const cancelModalBtn = document.getElementById("cancelModalBtn");






// Open modal from the Dashboard
addApplicationBtn.addEventListener("click", () => {
    applicationModal.style.display = "flex";
});

// Open modal from the Applications section
applicationsAddBtn.addEventListener("click", () => {
    applicationModal.style.display = "flex";
});


// Close modal

closeModalBtn.addEventListener("click", () => {

    applicationModal.style.display = "none";

});


// Cancel button

cancelModalBtn.addEventListener("click", () => {

    applicationModal.style.display = "none";

});


// Close modal when clicking outside the form

applicationModal.addEventListener("click", (event) => {

    if (event.target === applicationModal) {

        applicationModal.style.display = "none";

    }

});

// ================================
// APPLICATION DATA
// ================================
let applications = [];

let statusChartInstance = null;
let activityChartInstance = null;

// Stores the ID of the application being edited.
// Null means we are adding a new application.
let editingApplicationId = null;


// ================================
// LOCAL STORAGE
// ================================

const STORAGE_KEY = "jobTrackerApplications";

// Each account gets its own Local Storage namespace.
// The email is normalized and encoded to create a stable key.
function getUserStorageKey(baseKey) {
    const currentUser = JSON.parse(
        localStorage.getItem("jobTrackerCurrentUser") || "null"
    );

    if (!currentUser || !currentUser.email) {
        return null;
    }

    const userId = encodeURIComponent(currentUser.email.trim().toLowerCase());
    return `${baseKey}_${userId}`;
}

// Save only the logged-in user's applications.
function saveApplications() {
    const userStorageKey = getUserStorageKey(STORAGE_KEY);
    if (!userStorageKey) return;

    localStorage.setItem(userStorageKey, JSON.stringify(applications));
}

// Load only the logged-in user's applications.
function loadApplications() {
    const userStorageKey = getUserStorageKey(STORAGE_KEY);
    applications = [];

    if (!userStorageKey) return;

    const savedApplications = localStorage.getItem(userStorageKey);

    if (savedApplications) {
        try {
            const parsedApplications = JSON.parse(savedApplications);
            if (Array.isArray(parsedApplications)) {
                applications = parsedApplications;
            }
        } catch (error) {
            console.error("Could not load this user's applications:", error);
            applications = [];
        }
    }

    // Give older records in this user's scoped list an ID if they don't have one.
    applications.forEach((application) => {
        if (!application.id) application.id = crypto.randomUUID();
    });

    saveApplications();
}




// ================================
// FORM
// ================================

const applicationForm = document.getElementById("applicationForm");

const recentApplications = document.getElementById("recentApplications");

const allApplications = document.getElementById("allApplications");


const searchApplications = document.getElementById("searchApplications");
const filterStatus = document.getElementById("filterStatus");
const filterDateFrom = document.getElementById("filterDateFrom");
const filterDateTo = document.getElementById("filterDateTo");
const clearFiltersBtn = document.getElementById("clearFilters");



const totalApplications = document.getElementById("totalApplications");


// ================================
// SUBMIT APPLICATION
// ================================

applicationForm.addEventListener("submit", (event) => {
    event.preventDefault();

    // Collect the information from the form
    const applicationData = {
        company: document.getElementById("company").value.trim(),
        jobTitle: document.getElementById("jobTitle").value.trim(),
        status: document.getElementById("status").value,
        dateApplied: document.getElementById("dateApplied").value,
        jobLink: document.getElementById("jobLink").value.trim(),
        notes: document.getElementById("notes").value.trim()
    };

    if (editingApplicationId !== null) {

        // Update the existing application
        applications = applications.map((application) =>
            application.id === editingApplicationId
                ? { ...application, ...applicationData }
                : application
        );

    } else {

        // Create a new application with a unique ID
        const newApplication = {
            id: crypto.randomUUID(),
            ...applicationData
        };

        // Add the new application
        applications.push(newApplication);
    }

    // Save all changes
    saveApplications();

    // Refresh the application lists and statistics
    displayApplications();
    updateStatistics();

    // Reset the form and editing mode
    applicationForm.reset();
    editingApplicationId = null;

    const submitButton = applicationForm.querySelector(
        'button[type="submit"]'
    );

    if (submitButton) {
        submitButton.textContent = "Add Application";
    }

    // Close the modal
    applicationModal.style.display = "none";
});




function getFilteredApplications() {

    const searchTerm = searchApplications.value.trim().toLowerCase();
    const selectedStatus = filterStatus.value;
    const fromDate = filterDateFrom.value;
    const toDate = filterDateTo.value;

    return applications.filter(function(application) {

        const company = (application.company || "").toLowerCase();
        const jobTitle = (application.jobTitle || "").toLowerCase();

        const matchesSearch =
            company.includes(searchTerm) ||
            jobTitle.includes(searchTerm);

        const matchesStatus =
            !selectedStatus || application.status === selectedStatus;

        const matchesFromDate =
            !fromDate ||
            (application.dateApplied && application.dateApplied >= fromDate);

        const matchesToDate =
            !toDate ||
            (application.dateApplied && application.dateApplied <= toDate);

        return (
            matchesSearch &&
            matchesStatus &&
            matchesFromDate &&
            matchesToDate
        );

    });

}



// ================================
// DISPLAY APPLICATIONS
// ================================

function displayApplications() {

    // Clear both application lists
    recentApplications.innerHTML = "";
    allApplications.innerHTML = "";

    // Check whether any applications have been saved
    if (applications.length === 0) {

        recentApplications.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">+</div>
                <h3>No applications yet</h3>
                <p>Start tracking your job applications here.</p>
            </div>
        `;

        allApplications.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">+</div>
                <h3>No applications yet</h3>
                <p>Your job applications will appear here.</p>
            </div>
        `;

        return;
    }

    // Get applications that match the selected filters
    const filteredApplications = getFilteredApplications();

    // Show a message if no applications match the filters
    if (filteredApplications.length === 0) {

        allApplications.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⌕</div>
                <h3>No matching applications</h3>
                <p>Try changing your search or filters.</p>
            </div>
        `;

    } else {

        // Display only matching applications in the Applications section
        filteredApplications.forEach((application) => {

            const applicationItem = document.createElement("div");

            applicationItem.classList.add("application-item");

            applicationItem.innerHTML = `
                <div class="application-info">
                    <h3>${application.jobTitle}</h3>
                    <p>${application.company}</p>
                </div>

                <div class="application-details">
                    <span class="application-status status-${application.status.toLowerCase()}">
                        ${application.status}
                    </span>

                    <span class="application-date">
                        ${application.dateApplied}
                    </span>
                </div>

                <div class="application-actions">
                    <button
                        type="button"
                        class="edit-application-btn"
                        data-id="${application.id}">
                        Edit
                    </button>

                    <button
                        type="button"
                        class="delete-application-btn"
                        data-id="${application.id}">
                        Delete
                    </button>
                </div>
            `;

            allApplications.appendChild(applicationItem);

        });

    }

    // Always show the five most recent applications on the Dashboard
    applications.slice(-5).reverse().forEach((application) => {

        const applicationItem = document.createElement("div");

        applicationItem.classList.add("application-item");

        applicationItem.innerHTML = `
            <div class="application-info">
                <h3>${application.jobTitle}</h3>
                <p>${application.company}</p>
            </div>

            <div class="application-details">
                <span class="application-status status-${application.status.toLowerCase()}">
                    ${application.status}
                </span>

                <span class="application-date">
                    ${application.dateApplied}
                </span>
            </div>
        `;

        recentApplications.appendChild(applicationItem);

    });

}

/* ================================
   SIDEBAR NAVIGATION
================================ */

const navLinks = document.querySelectorAll(".nav-link");
const pageSections = document.querySelectorAll(".page-section");

navLinks.forEach((link) => {

    link.addEventListener("click", (event) => {

        // Prevent the link from jumping to the top
        event.preventDefault();

        // Get the section connected to this link
        const sectionId = link.dataset.section;

        // Hide all sections
        pageSections.forEach((section) => {
            section.classList.remove("active");
        });

        // Remove active styling from all sidebar links
        navLinks.forEach((navLink) => {
            navLink.classList.remove("active");
        });

        // Show the selected section
        const selectedSection = document.getElementById(sectionId);

        if (selectedSection) {
            selectedSection.classList.add("active");
            link.classList.add("active");
        }

    });

});


/* ================================
   UPDATE DASHBOARD AND ANALYTICS
================================ */

function updateStatistics() {

    const total = applications.length;

    const interviews = applications.filter(
        (application) => application.status === "Interview"
    ).length;

    const offers = applications.filter(
        (application) => application.status === "Offer"
    ).length;

    const rejected = applications.filter(
        (application) => application.status === "Rejected"
    ).length;

    // Update Dashboard statistics
    document.getElementById("totalApplications").textContent = total;
    document.getElementById("totalInterviews").textContent = interviews;
    document.getElementById("totalOffers").textContent = offers;
    document.getElementById("totalRejected").textContent = rejected;

    // Update Analytics percentages
    document.getElementById("successRate").textContent =
        total ? `${Math.round((offers / total) * 100)}%` : "0%";

    document.getElementById("interviewRate").textContent =
        total ? `${Math.round((interviews / total) * 100)}%` : "0%";

    // Update both charts
    renderAnalyticsCharts();

}


/* ================================
   RENDER ANALYTICS CHARTS
================================ */

function renderAnalyticsCharts() {

    // Stop if Chart.js has not loaded
    if (typeof Chart === "undefined") {
        console.error("Chart.js has not loaded.");
        return;
    }

    // Count applications by status
    const statuses = ["Applied", "Interview", "Offer", "Rejected"];

    const statusCounts = statuses.map((status) =>
        applications.filter(
            (application) => application.status === status
        ).length
    );

    // Find the chart canvases
    const statusCanvas = document.getElementById("statusChart");
    const activityCanvas = document.getElementById("activityChart");

    if (!statusCanvas || !activityCanvas) return;

    // Remove old charts before creating updated ones
    if (statusChartInstance) {
        statusChartInstance.destroy();
    }

    if (activityChartInstance) {
        activityChartInstance.destroy();
    }

    // APPLICATION STATUS DOUGHNUT CHART
    statusChartInstance = new Chart(statusCanvas, {
        type: "doughnut",

        data: {
            labels: statuses,

            datasets: [{
                data: statusCounts,

                backgroundColor: [
                    "#3B82F6",
                    "#A78BFA",
                    "#34D399",
                    "#F87171"
                ],

                borderColor: "#111827",
                borderWidth: 3,
                hoverOffset: 8
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    position: "bottom",

                    labels: {
                        color: "#A8B8D0",
                        padding: 20
                    }
                }
            }
        }
    });

    // APPLICATION ACTIVITY BAR CHART
    const monthlyTotals = {};

    applications.forEach((application) => {

        if (!application.dateApplied) return;

        // Group applications by year and month
        const date = new Date(
            application.dateApplied + "T12:00:00"
        );

        if (Number.isNaN(date.getTime())) return;

        const monthKey =
            `${date.getFullYear()}-${String(
                date.getMonth() + 1
            ).padStart(2, "0")}`;

        monthlyTotals[monthKey] =
            (monthlyTotals[monthKey] || 0) + 1;

    });

    const monthKeys = Object.keys(monthlyTotals).sort();

    const monthLabels = monthKeys.map((key) => {

        const [year, month] = key.split("-").map(Number);

        return new Date(year, month - 1, 1)
            .toLocaleDateString("en-ZA", {
                month: "short",
                year: "numeric"
            });
    });

    const monthlyCounts = monthKeys.map(
        (key) => monthlyTotals[key]
    );

    activityChartInstance = new Chart(activityCanvas, {
        type: "bar",

        data: {
            labels: monthLabels,

            datasets: [{
                label: "Applications Submitted",
                data: monthlyCounts,

                backgroundColor: "#3B82F6",
                hoverBackgroundColor: "#60A5FA",
                borderRadius: 6,
                maxBarThickness: 48
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    labels: {
                        color: "#A8B8D0"
                    }
                }
            },

            scales: {
                x: {
                    ticks: {
                        color: "#A8B8D0"
                    },

                    grid: {
                        display: false
                    }
                },

                y: {
                    beginAtZero: true,

                    ticks: {
                        color: "#A8B8D0",
                        precision: 0,
                        stepSize: 1
                    },

                    grid: {
                        color: "#23324A"
                    }
                }
            }
        }
    });

}


/* ================================
   EDIT AND DELETE APPLICATIONS
================================ */

const submitButton = applicationForm.querySelector(
    'button[type="submit"]'
);

// Handle clicks on Edit and Delete buttons
allApplications.addEventListener("click", (event) => {
    const editButton = event.target.closest(".edit-application-btn");
    const deleteButton = event.target.closest(".delete-application-btn");

    // EDIT APPLICATION
    if (editButton) {
        const application = applications.find(
            (item) => item.id === editButton.dataset.id
        );

        if (!application) return;

        editingApplicationId = application.id;

        document.getElementById("company").value = application.company;
        document.getElementById("jobTitle").value = application.jobTitle;
        document.getElementById("status").value = application.status;
        document.getElementById("dateApplied").value = application.dateApplied;
        document.getElementById("jobLink").value = application.jobLink || "";
        document.getElementById("notes").value = application.notes || "";

        submitButton.textContent = "Update Application";
        applicationModal.style.display = "flex";
    }

    // DELETE APPLICATION
    if (deleteButton) {
        const application = applications.find(
            (item) => item.id === deleteButton.dataset.id
        );

        if (!application) return;

        const confirmed = confirm(
            `Delete the application for ${application.company}?`
        );

        if (!confirmed) return;

        applications = applications.filter(
            (item) => item.id !== deleteButton.dataset.id
        );

        saveApplications();
        displayApplications();
        updateStatistics();
    }
});

// ================================
// INITIALIZE JOB TRACKER
// ================================

loadApplications();
displayApplications();
updateStatistics();


 // Search applications as you type
searchApplications.addEventListener("input", displayApplications);

// Filter applications by status
filterStatus.addEventListener("change", displayApplications);

// Filter applications by start date
filterDateFrom.addEventListener("change", displayApplications);

// Filter applications by end date
filterDateTo.addEventListener("change", displayApplications);

// Clear all filters
clearFiltersBtn.addEventListener("click", function() {

    searchApplications.value = "";
    filterStatus.value = "";
    filterDateFrom.value = "";
    filterDateTo.value = "";

    displayApplications();

});



/* ===== Login and Registration Elements ===== */

// Login screen
const loginScreen = document.getElementById("loginScreen");


// Login form and inputs
const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginMessage = document.getElementById("loginMessage");

// Registration form and inputs
const registerForm = document.getElementById("registerForm");
const registerName = document.getElementById("registerName");
const registerEmail = document.getElementById("registerEmail");
const registerPassword = document.getElementById("registerPassword");
const registerMessage = document.getElementById("registerMessage");

// Buttons for switching between forms
const showRegisterBtn = document.getElementById("showRegisterBtn");
const showLoginBtn = document.getElementById("showLoginBtn");



/* ===== Switch Between Login and Registration ===== */

// Show the registration form
showRegisterBtn.addEventListener("click", function() {
    loginForm.hidden = true;
    registerForm.hidden = false;

    loginMessage.textContent = "";
    registerMessage.textContent = "";
});

// Show the login form
showLoginBtn.addEventListener("click", function() {
    registerForm.hidden = true;
    loginForm.hidden = false;

    loginMessage.textContent = "";
    registerMessage.textContent = "";
});



/* ===== Demo Account Registration ===== */

const USERS_KEY = "jobTrackerDemoUsers";

// Handle account registration
registerForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const name = registerName.value.trim();
    const email = registerEmail.value.trim().toLowerCase();
    const password = registerPassword.value;

    // Get existing accounts from localStorage
    const savedUsers = JSON.parse(
        localStorage.getItem(USERS_KEY) || "[]"
    );

    // Check whether this email is already registered
    const existingUser = savedUsers.find(function(user) {
        return user.email === email;
    });

    if (existingUser) {
        registerMessage.textContent =
            "An account with this email already exists.";
        registerMessage.style.color = "#f87171";
        return;
    }

    // Create the new demo account
    const newUser = {
        name: name,
        email: email,
        password: password,
        role: "Job Seeker"
    };

    savedUsers.push(newUser);

    // Save all accounts in the browser
    localStorage.setItem(
        USERS_KEY,
        JSON.stringify(savedUsers)
    );

    // Show a success message
    registerMessage.textContent =
        "Account created successfully! You can now sign in.";
    registerMessage.style.color = "#34d399";

    // Clear the registration fields
    registerForm.reset();
});


/* ===== Demo Account Login ===== */

const CURRENT_USER_KEY = "jobTrackerCurrentUser";

// Handle login form submission
loginForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const email = loginEmail.value.trim().toLowerCase();
    const password = loginPassword.value;

    // Retrieve registered accounts
    const savedUsers = JSON.parse(
        localStorage.getItem(USERS_KEY) || "[]"
    );

    // Find an account matching the email and password
    const user = savedUsers.find(function(account) {
        return account.email === email &&
               account.password === password;
    });

    // Show an error if the details are incorrect
    if (!user) {
        loginMessage.textContent =
            "Incorrect email or password. Please try again.";
        loginMessage.style.color = "#f87171";
        return;
    }

    // Save the logged-in user's session
    const currentUser = {
        name: user.name,
        email: user.email,
        role: user.role
    };

    localStorage.setItem(
        CURRENT_USER_KEY,
        JSON.stringify(currentUser)
    );

    // Load this account's private job-tracker records after authentication.
    loadApplications();
    loadInterviews();
    displayApplications();
    updateStatistics();
    displayInterviews();
    displayUpcomingInterviews();

    // Hide the login screen to reveal the dashboard
    loginScreen.style.display = "none";
    updateDashboardProfile(currentUser);

    // Clear the login form
    loginForm.reset();
    loginMessage.textContent = "";
});


/* ===== Personalize the Dashboard ===== */

const dashboardGreeting = document.getElementById("dashboardGreeting");
const profileName = document.getElementById("profileName");
const profileRole = document.getElementById("profileRole");

// Choose a greeting based on the current time
function getGreeting() {
    const hour = new Date().getHours();

    if (hour < 12) {
        return "Good morning";
    } else if (hour < 18) {
        return "Good afternoon";
    } else {
        return "Good evening";
    }
}

// Display the logged-in user's information
function updateDashboardProfile(user) {
    dashboardGreeting.textContent =
        `${getGreeting()}, ${user.name}`;

    profileName.textContent = user.name;
    profileRole.textContent = user.role || "Job Seeker";
}



/* ===== Log Out ===== */

const logoutBtn = document.getElementById("logoutBtn");

logoutBtn.addEventListener("click", function() {
    // Remove the saved login session.
    localStorage.removeItem(CURRENT_USER_KEY);

    // Clear in-memory data so it cannot remain visible after logout.
    applications = [];
    interviews = [];
    displayApplications();
    updateStatistics();
    displayInterviews();
    displayUpcomingInterviews();

    // Show the login screen again
    loginScreen.style.display = "flex";

    // Reset the login form and messages
    loginForm.reset();
    loginMessage.textContent = "";
    registerMessage.textContent = "";

    // Return to the Sign In form
    registerForm.hidden = true;
    loginForm.hidden = false;
});



/* ===== Restore Login Session ===== */

const savedSession = JSON.parse(
    localStorage.getItem(CURRENT_USER_KEY) || "null"
);

if (savedSession) {
    // Restore this user's records when an existing session is resumed.
    loadApplications();
    displayApplications();
    updateStatistics();

    loginScreen.style.display = "none";
    updateDashboardProfile(savedSession);
}



/* ===== Interview Form Controls ===== */

const showInterviewFormBtn = document.getElementById("showInterviewFormBtn");
const interviewForm = document.getElementById("interviewForm");
const cancelInterviewBtn = document.getElementById("cancelInterviewBtn");


 // Open a fresh form for a new interview
showInterviewFormBtn.addEventListener("click", function() {
    interviewForm.reset();

    document.getElementById("interviewId").value = "";

    document.getElementById("interviewFormTitle").textContent =
        "Schedule an Interview";

    document.getElementById("saveInterviewBtn").textContent =
        "Save Interview";

    interviewMessage.textContent = "";

    interviewForm.hidden = false;
    showInterviewFormBtn.hidden = true;
});



cancelInterviewBtn.addEventListener("click", function() {
    // Close the form
    interviewForm.hidden = true;
    showInterviewFormBtn.hidden = false;

    // Clear all form fields
    interviewForm.reset();

    // Clear the saved interview ID
    document.getElementById("interviewId").value = "";

    // Reset the heading and button text
    document.getElementById("interviewFormTitle").textContent =
        "Schedule an Interview";

    document.getElementById("saveInterviewBtn").textContent =
        "Save Interview";

    // Clear any previous message
    interviewMessage.textContent = "";
});



/* ===== Save and Display Interviews ===== */

const interviewId = document.getElementById("interviewId");
const interviewCompany = document.getElementById("interviewCompany");
const interviewRole = document.getElementById("interviewRole");
const interviewDate = document.getElementById("interviewDate");
const interviewTime = document.getElementById("interviewTime");
const interviewType = document.getElementById("interviewType");
const interviewNotes = document.getElementById("interviewNotes");
const interviewMessage = document.getElementById("interviewMessage");
const allInterviews = document.getElementById("allInterviews");

const INTERVIEWS_KEY = "jobTrackerInterviews";

// Interview records are isolated using the same account namespace as applications.
let interviews = [];

function loadInterviews() {
    const userStorageKey = getUserStorageKey(INTERVIEWS_KEY);
    interviews = [];

    if (!userStorageKey) return;

    try {
        const savedInterviews = JSON.parse(
            localStorage.getItem(userStorageKey) || "[]"
        );
        interviews = Array.isArray(savedInterviews) ? savedInterviews : [];
    } catch (error) {
        console.error("Could not load this user's interviews:", error);
        interviews = [];
    }

    interviews.forEach((interview) => {
        if (!interview.id) interview.id = crypto.randomUUID();
    });

    saveInterviews();
}

// Save only the logged-in user's interviews.
function saveInterviews() {
    const userStorageKey = getUserStorageKey(INTERVIEWS_KEY);
    if (!userStorageKey) return;

    localStorage.setItem(userStorageKey, JSON.stringify(interviews));
}


function displayInterviews() {
    allInterviews.replaceChildren();

    if (interviews.length === 0) {
        const emptyState = document.createElement("div");
        emptyState.className = "empty-state";

        const icon = document.createElement("div");
        icon.className = "empty-icon";
        icon.textContent = "◷";

        const heading = document.createElement("h3");
        heading.textContent = "No interviews scheduled";

        const message = document.createElement("p");
        message.textContent =
            "Your scheduled interviews will appear here.";

        emptyState.append(icon, heading, message);
        allInterviews.appendChild(emptyState);
        return;
    }

    const sortedInterviews = [...interviews].sort(function(a, b) {
        return (a.date + "T" + a.time).localeCompare(
            b.date + "T" + b.time
        );
    });

    sortedInterviews.forEach(function(interview) {
        const card = document.createElement("div");
        card.className = "interview-item";

        // Date block
        const dateBlock = document.createElement("div");
        dateBlock.className = "interview-date-block";

        const interviewDateValue = new Date(
            interview.date + "T12:00:00"
        );

        const month = document.createElement("span");
        month.className = "interview-month";
        month.textContent = interviewDateValue
            .toLocaleString("en-US", { month: "short" })
            .toUpperCase();

        const day = document.createElement("span");
        day.className = "interview-day";
        day.textContent = interviewDateValue.getDate();

        dateBlock.append(month, day);

        // Company and role
        const details = document.createElement("div");
        details.className = "interview-details";

        const heading = document.createElement("h3");
        heading.textContent = interview.company;

        const role = document.createElement("p");
        role.className = "interview-role";
        role.textContent = interview.role;

        // Interview time
        const time = document.createElement("p");
        time.className = "interview-time";

        const clock = document.createElement("span");
        clock.textContent = "◷";

        const timeText = document.createElement("span");
        timeText.textContent = interview.time;

        time.append(clock, timeText);
        details.append(heading, role, time);

        // Main card layout
        const mainContent = document.createElement("div");
        mainContent.className = "interview-main-content";
        mainContent.append(dateBlock, details);

        card.appendChild(mainContent);

        // Interview type and status badges
        const badges = document.createElement("div");
        badges.className = "interview-badges";

        const type = document.createElement("span");
        type.className = "interview-type-badge";
        type.textContent = interview.type;
        type.dataset.type = interview.type.trim().toLowerCase();

        badges.appendChild(type);

        const status = document.createElement("span");
        status.className = "interview-status-badge";
        status.textContent = "Scheduled";

        badges.appendChild(status);
        card.appendChild(badges);

        // Optional notes
        if (interview.notes) {
            const notes = document.createElement("p");
            notes.className = "interview-notes";
            notes.textContent = "Notes: " + interview.notes;
            card.appendChild(notes);
        }

        // Edit button
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "edit-interview-btn";
        editButton.innerHTML = "&#9998; Edit";

        editButton.addEventListener("click", function() {
            editInterview(interview.id);
        });

        // Delete button
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-interview-btn";
        deleteButton.innerHTML = "&#128465; Delete";

        deleteButton.addEventListener("click", function() {
            deleteInterview(interview.id);
        });

        const actions = document.createElement("div");
        actions.className = "interview-actions";
        actions.append(editButton, deleteButton);

        card.append(actions);
        allInterviews.appendChild(card);
    });
}



/* ===== Display Upcoming Interviews on Dashboard ===== */

const upcomingInterviews = document.getElementById("upcomingInterviews");

function displayUpcomingInterviews() {
    upcomingInterviews.replaceChildren();

    // Get the current local date and time
    const now = new Date();

    const today =
        now.getFullYear() + "-" +
        String(now.getMonth() + 1).padStart(2, "0") + "-" +
        String(now.getDate()).padStart(2, "0");

    const currentTime =
        String(now.getHours()).padStart(2, "0") + ":" +
        String(now.getMinutes()).padStart(2, "0");

    // Keep only interviews that have not passed
    const upcoming = interviews
        .filter(function(interview) {
            return interview.date > today ||
                (interview.date === today &&
                 interview.time >= currentTime);
        })
        .sort(function(a, b) {
            return (a.date + "T" + a.time).localeCompare(
                b.date + "T" + b.time
            );
        });

    // Show an empty message if there are no upcoming interviews
    if (upcoming.length === 0) {
        const emptyState = document.createElement("div");
        emptyState.className = "empty-state small";

        const heading = document.createElement("h3");
        heading.textContent = "No upcoming interviews";

        const message = document.createElement("p");
        message.textContent =
            "Your scheduled interviews will appear here.";

        emptyState.append(heading, message);
        upcomingInterviews.appendChild(emptyState);
        return;
    }

    
    // Create a polished card for each upcoming interview
    upcoming.forEach(function(interview) {
        const card = document.createElement("div");
        card.className = "upcoming-interview-item";

        // Date block
        const dateBlock = document.createElement("div");
        dateBlock.className = "interview-date-block";

        const interviewDate = new Date(
            interview.date + "T12:00:00"
        );

        const month = document.createElement("span");
        month.className = "interview-month";
        month.textContent = interviewDate
            .toLocaleString("en-US", { month: "short" })
            .toUpperCase();

        const day = document.createElement("span");
        day.className = "interview-day";
        day.textContent = interviewDate.getDate();

        dateBlock.append(month, day);

        // Main interview details
        const details = document.createElement("div");
        details.className = "interview-details";

        const company = document.createElement("h3");
        company.textContent = interview.company;

        const role = document.createElement("p");
        role.className = "interview-role";
        role.textContent = interview.role;

        const time = document.createElement("p");
        time.className = "interview-time";

        const clock = document.createElement("span");
        clock.textContent = "◷";

        const timeText = document.createElement("span");
        timeText.textContent = interview.time;

        time.append(clock, timeText);
        details.append(company, role, time);

        // Interview type badge
        const badges = document.createElement("div");
        badges.className = "interview-badges";

        const type = document.createElement("span");
        type.className = "interview-type-badge";
        type.textContent = interview.type;

        badges.appendChild(type);

        // Upcoming status badge
        const status = document.createElement("span");
        status.className = "interview-status-badge";
        status.textContent = "Upcoming";

        badges.appendChild(status);

        // Assemble the card
        const mainContent = document.createElement("div");
        mainContent.className = "interview-main-content";

        mainContent.append(dateBlock, details);

        card.append(mainContent, badges);
        upcomingInterviews.appendChild(card);
    });

}



interviewForm.addEventListener("submit", function(event) {
    event.preventDefault();

    // Check whether we are editing an existing interview
    const interviewId = document.getElementById("interviewId").value;

    const interviewData = {
        company: interviewCompany.value.trim(),
        role: interviewRole.value.trim(),
        date: interviewDate.value,
        time: interviewTime.value,
        type: interviewType.value,
        notes: interviewNotes.value.trim()
    };

    if (interviewId) {
        // Update the existing interview
        const interviewIndex = interviews.findIndex(function(interview) {
            return interview.id === interviewId;
        });

        if (interviewIndex !== -1) {
            interviews[interviewIndex] = {
                ...interviews[interviewIndex],
                ...interviewData
            };
        }
    } else {
        // Add a new interview
        const newInterview = {
            id: Date.now().toString(),
            ...interviewData
        };

        interviews.push(newInterview);
    }

    // Save and refresh the interview displays
    saveInterviews();
    displayInterviews();
    displayUpcomingInterviews();

    // Reset the form after saving
    interviewForm.reset();
    document.getElementById("interviewId").value = "";

    document.getElementById("interviewFormTitle").textContent =
        "Schedule an Interview";

    document.getElementById("saveInterviewBtn").textContent =
        "Save Interview";

    interviewForm.hidden = true;
    showInterviewFormBtn.hidden = false;
    interviewMessage.textContent = "";
});


// Display interviews when the page loads
loadInterviews();
displayInterviews();
displayUpcomingInterviews();


function editInterview(interviewId) {
    // Find the interview the user wants to edit
    const interview = interviews.find(function(item) {
        return item.id === interviewId;
    });

    // Stop if the interview cannot be found
    if (!interview) {
        return;
    }

    // Fill the form with the existing interview details
    document.getElementById("interviewId").value = interview.id;
    interviewCompany.value = interview.company;
    interviewRole.value = interview.role;
    interviewDate.value = interview.date;
    interviewTime.value = interview.time;
    interviewType.value = interview.type;
    interviewNotes.value = interview.notes || "";

    // Change the form heading and submit button
    document.getElementById("interviewFormTitle").textContent =
        "Edit Interview";

    saveInterviewBtn.textContent = "Update Interview";

    // Show the form and hide the Schedule Interview button
    interviewForm.hidden = false;
    showInterviewFormBtn.hidden = true;

    // Bring the form into view
    interviewForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


function deleteInterview(interviewId) {
    // Find the interview to delete
    const interview = interviews.find(function(item) {
        return item.id === interviewId;
    });

    // Stop if the interview cannot be found
    if (!interview) {
        return;
    }

    // Ask for confirmation before deleting
    const confirmed = confirm(
        `Are you sure you want to delete the interview with ${interview.company}?`
    );

    // Stop if the user cancels
    if (!confirmed) {
        return;
    }

    // Remove the selected interview
    interviews = interviews.filter(function(item) {
        return item.id !== interviewId;
    });

    // Save the updated list and refresh the displays
    saveInterviews();
    displayInterviews();
    displayUpcomingInterviews();
}

/* ================================
   DASHBOARD QUICK ACTIONS
================================ */

// Quick Action buttons
const quickAddApplicationBtn = document.getElementById(
    "quickAddApplicationBtn"
);

const quickScheduleInterviewBtn = document.getElementById(
    "quickScheduleInterviewBtn"
);


// Open Add Application modal
quickAddApplicationBtn.addEventListener("click", function() {

    // Open the existing application modal
    applicationModal.style.display = "flex";

});


// Navigate to Interviews and open the scheduling form
quickScheduleInterviewBtn.addEventListener("click", function() {

    // Find the Interviews navigation link
    const interviewsNavLink = document.querySelector(
        '.nav-link[data-section="interviewsSection"]'
    );

    // Navigate to the Interviews section
    if (interviewsNavLink) {
        interviewsNavLink.click();
    }

    // Open the interview scheduling form
    showInterviewFormBtn.click();

});