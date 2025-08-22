// =================================================================================
//                            MAIN JAVASCRIPT FILE
// =================================================================================

document.addEventListener("DOMContentLoaded", () => {
  // --- GLOBAL SETUP & VARIABLES ---
  // const API_BASE_URL = "http://localhost:80/api";
  const API_BASE_URL = 'https://smartscan-attend-hosted-production.up.railway.app';

  // --- GLOBAL SITE FUNCTIONALITY (e.g., Mobile Navigation) ---
  // This code runs on EVERY page that includes the header.
  const menuBtn = document.getElementById("menuBtn");
  const closeBtn = document.getElementById("closeBtn");
  const heading = document.querySelector(".heading");

  if (menuBtn && closeBtn && heading) {
    menuBtn.addEventListener("click", () => {
      heading.classList.add("active");
    });

    closeBtn.addEventListener("click", () => {
      heading.classList.remove("active");
    });
  }

  // =================================================================================
  //                           PAGE-SPECIFIC INITIALIZERS
  // =================================================================================

  // --- ANALYTICS PAGE SCRIPT ---
  if (document.getElementById("attendanceChart")) {
    console.log("Analytics Page script loaded.");
    initializeAnalyticsPage();
  }

  // --- ATTENDANCE PAGE SCRIPT ---
  if (document.getElementById("attendanceTable")) {
    console.log("Attendance Page script loaded.");
    initializeAttendancePage();
  }

  // --- MANAGE STUDENTS PAGE SCRIPT ---
  if (document.getElementById("studentSearchInput")) {
    console.log("Manage Students Page script loaded.");
    initializeManagePage();
  }

  // --- LOGS PAGE SCRIPT ---
  if (document.getElementById("logsTableBody")) {
    console.log("Logs Page script loaded.");
    initializeLogsPage();
  }

  // --- NEW: NOTIFICATION PANEL SCRIPT ---
  // This runs on all pages because the header is on all pages
  if (document.getElementById("notificationIcon")) {
    console.log("Notification script loaded.");
    initializeNotificationPanel();
  }

  // --- SETTINGS PAGE SCRIPT ---
  // This runs on all pages because the header is on all pages
  if (document.querySelector(".settings-layout")) {
    console.log("Settings Page script loaded.");
    initializeSettingsPage();
  }
  // -------- FOR MOBILE SCREENS -----
  if (document.getElementById("fullNotificationList")) {
    console.log("Notifications Page script loaded.");
    initializeNotificationsPage();
  }

  // =================================================================================
  //                          NOTIFICATION PANEL FUNCTIONALITY
  // =================================================================================
  function initializeNotificationPanel() {
    const notificationIcon = document.getElementById("notificationIcon");
    const notificationBadge = document.getElementById("notificationBadge");
    const notificationPanel = document.getElementById("notificationPanel");
    const notificationList = document.getElementById("notificationList");
    const markAsReadBtn = document.getElementById("markAsReadBtn");

    // Function to fetch notifications from the server
    async function fetchNotifications() {
      try {
        const response = await fetch(`${API_BASE_URL}/notifications`);
        if (!response.ok) return;

        const { notifications, unreadCount } = await response.json();
        updateNotificationUI(notifications, unreadCount);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    }

    // Function to update the badge and list
    function updateNotificationUI(notifications, unreadCount) {
      // Update badge
      if (unreadCount > 0) {
        notificationBadge.textContent = unreadCount;
        notificationBadge.style.display = "block";
      } else {
        notificationBadge.style.display = "none";
      }

      // Update list
      notificationList.innerHTML = "";
      if (notifications.length === 0) {
        notificationList.innerHTML = "<li>No new notifications.</li>";
        return;
      }

      notifications.forEach((notif) => {
        const listItem = document.createElement("li");
        if (!notif.read) {
          listItem.classList.add("unread");
        }
        listItem.innerHTML = `
                <span class="title">${notif.title}</span>
                <span class="message">${notif.message}</span>
            `;
        notificationList.appendChild(listItem);
      });
    }

    // Function to mark notifications as read
    async function markAsRead() {
      try {
        await fetch(`${API_BASE_URL}/notifications/mark-read`, {
          method: "POST",
        });
        // After marking as read, fetch the list again to update the UI
        fetchNotifications();
        notificationPanel.style.display = "none"; // Close the panel
      } catch (error) {
        console.error("Failed to mark notifications as read:", error);
      }
    }

    // --- EVENT LISTENERS ---
    notificationIcon.addEventListener("click", (event) => {
      event.stopPropagation(); // Prevents the window click from closing it immediately
      const isHidden = notificationPanel.style.display === "none";
      notificationPanel.style.display = isHidden ? "block" : "none";
      if (isHidden) {
        fetchNotifications(); // Fetch latest notifications when opening
      }
    });

    markAsReadBtn.addEventListener("click", (event) => {
      event.preventDefault();
      markAsRead();
    });

    // Close the panel if clicking anywhere else on the page
    window.addEventListener("click", () => {
      if (notificationPanel.style.display === "block") {
        notificationPanel.style.display = "none";
      }
    });

    // Initial fetch when the page loads
    fetchNotifications();
    // Also, poll for new notifications every 30 seconds
    setInterval(fetchNotifications, 30000);
  }

  // // --- NOTIFICATIONS PAGE SCRIPT FOR MOBILE SCREENS---
  function initializeNotificationsPage() {
    const listElement = document.getElementById("fullNotificationList");
    const markAllReadBtn = document.getElementById("markAllReadBtn");

    // Function to calculate how long ago a notification was created
    function timeAgo(date) {
      const seconds = Math.floor((new Date() - new Date(date)) / 1000);
      let interval = seconds / 31536000;
      if (interval > 1) return Math.floor(interval) + " years ago";
      interval = seconds / 2592000;
      if (interval > 1) return Math.floor(interval) + " months ago";
      interval = seconds / 86400;
      if (interval > 1) return Math.floor(interval) + " days ago";
      interval = seconds / 3600;
      if (interval > 1) return Math.floor(interval) + " hours ago";
      interval = seconds / 60;
      if (interval > 1) return Math.floor(interval) + " minutes ago";
      return Math.floor(seconds) + " seconds ago";
    }

    // Function to fetch and display all notifications
    async function loadNotifications() {
      listElement.innerHTML =
        '<li class="loading-placeholder">Loading notifications...</li>';
      try {
        const response = await fetch(`${API_BASE_URL}/notifications`);
        if (!response.ok) throw new Error("Failed to fetch");

        const { notifications } = await response.json();

        listElement.innerHTML = ""; // Clear the list

        if (notifications.length === 0) {
          listElement.innerHTML =
            '<li class="empty-placeholder">You have no notifications.</li>';
          return;
        }

        notifications.forEach((notif) => {
          const listItem = document.createElement("li");
          if (!notif.read) {
            listItem.classList.add("unread");
          }
          listItem.innerHTML = `
                    <span class="title">${notif.title}</span>
                    <span class="message">${notif.message}</span>
                    <span class="timestamp">${timeAgo(notif.createdAt)}</span>
                `;
          listElement.appendChild(listItem);
        });
      } catch (error) {
        listElement.innerHTML =
          '<li class="empty-placeholder">Could not load notifications.</li>';
        console.error(error);
      }
    }

    // Function to handle marking all as read
    async function markAllAsRead() {
      try {
        await fetch(`${API_BASE_URL}/notifications/mark-read`, {
          method: "POST",
        });
        // After marking, reload the list to show the changes
        loadNotifications();
      } catch (error) {
        console.error("Failed to mark all as read:", error);
      }
    }

    // --- EVENT LISTENERS ---
    markAllReadBtn.addEventListener("click", (event) => {
      event.preventDefault();
      markAllAsRead();
    });

    // --- INITIAL LOAD ---
    loadNotifications();
  }

  // =================================================================================
  //                          FUNCTION DEFINITIONS BY PAGE
  // =================================================================================

  /**
   * Initializes all functionality for the ANALYTICS page.
   */
  function initializeAnalyticsPage() {
    const analyticsApi = `${API_BASE_URL}/analytics`;

    // --- ELEMENT SELECTORS ---
    const attendanceChartCtx = document
      .getElementById("attendanceChart")
      .getContext("2d");
    const genderChartCtx = document
      .getElementById("students-gender-chart")
      .getContext("2d");
    const weeklyAbsentCtx = document
      .getElementById("weekly-absent")
      .getContext("2d");
    const filterButton = document.querySelector(".filter-button");
    const classFilter = document.getElementById("classFilter");
    const dateFilter = document.getElementById("dateFilter");
    const totalStudentsValue = document.querySelector(
      ".total-students .attendance-value"
    );
    const presentTodayValue = document.querySelector(
      ".present-today .attendance-value"
    );
    const absentTodayValue = document.querySelector(
      ".absent-today .attendance-value"
    );
    const topAttendantList = document.querySelector(".top-attendant-list");
    const calendarDates = document.getElementById("calendarDates");
    const currentMonthYear = document.getElementById("currentMonthYear");
    const prevMonthBtn = document.getElementById("prevMonth");
    const nextMonthBtn = document.getElementById("nextMonth");

    // --- CHART INITIALIZATIONS (with EMPTY data) ---
    const attendanceChart = new Chart(attendanceChartCtx, {
      type: "bar",
      data: {
        labels: [],
        datasets: [
          {
            label: "Total attendance report",
            data: [],
            backgroundColor: "rgba(34, 197, 94, 0.2)",
            borderColor: "#22C55E",
            borderWidth: 2,
            tension: 0.4,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: { y: { beginAtZero: true } },
      },
    });
    const genderChart = new Chart(genderChartCtx, {
      type: "doughnut",
      data: {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: ["#2ECC71", "#2C3E50"],
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "bottom",
          },
        },
      },
    });
    const weeklyAbsentChart = new Chart(weeklyAbsentCtx, {
      type: "radar",
      data: {
        labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        datasets: [
          {
            label: "Absentees",
            data: [],
            backgroundColor: "rgba(46, 204, 113, 0.2)",
            borderColor: "#2ECC71",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
      },
    });

    // --- DATA FETCHING & UI UPDATES ---
    async function updateDashboard() {
      // The `selectedClass` variable is no longer needed and has been removed.
      const selectedDateRange = dateFilter.value;

      try {
        const [summary, report, gender, top, weekly] = await Promise.all([
          fetch(`${analyticsApi}/summary?period=${selectedDateRange}`).then(
            (res) => res.json()
          ),
          fetch(
            `${analyticsApi}/attendance-report?period=${selectedDateRange}`
          ).then((res) => res.json()),
          fetch(`${analyticsApi}/gender-distribution`).then((res) =>
            res.json()
          ),
          fetch(`${analyticsApi}/top-attendants?limit=6`).then((res) =>
            res.json()
          ),
          fetch(`${analyticsApi}/weekly-absentees`).then((res) => res.json()),
        ]);

        // These function calls remain the same as they operate on the fetched data.
        updateSummaryCards(summary);
        updateAttendanceChart(report);
        updateGenderChart(gender);
        updateTopAttendantsList(top);
        updateWeeklyAbsentChart(weekly);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }
    }
    // --- UI UPDATE FUNCTIONS ---
    // These functions update the UI with the fetched data.
    // They are called after the data is fetched in the `updateDashboard` function.
    function updateSummaryCards(data) {
      totalStudentsValue.textContent = data.totalStudents ?? "N/A";
      presentTodayValue.textContent = data.present ?? "N/A";
      absentTodayValue.textContent = data.absent ?? "N/A";
    }

    // These functions update the respective charts with the fetched data.
    function updateAttendanceChart(data) {
      attendanceChart.data.labels = data.labels;
      attendanceChart.data.datasets[0].data = data.data;
      attendanceChart.update();
    }
    // This function updates the gender chart with the fetched data.
    // It uses the `data` object to set the labels and dataset values.
    function updateGenderChart(data) {
      genderChart.data.labels = [`Male ${data.male}`, `Female ${data.female}`];
      genderChart.data.datasets[0].data = [data.male, data.female];
      genderChart.update();
    }
    // This function updates the weekly absent chart with the fetched data.
    function updateWeeklyAbsentChart(data) {
      weeklyAbsentChart.data.datasets[0].data = data.data;
      weeklyAbsentChart.update();
    }
    // This function updates the top attendants list with the fetched data.
    // It clears the existing list and populates it with new data.
    function updateTopAttendantsList(data) {
      topAttendantList.innerHTML = "";
      if (data && data.length > 0) {
        data.forEach((student) => {
          const listItem = `
                        <li>
                            <div>
                                <div class="student-img"><img src="${
                                  student.imageUrl || "images/img2.jpg"
                                }" alt="${student.name}"></div>
                                <div class="student-name">${student.name}</div>
                            </div>
                            <div class="present-days">
                                <span class="days">${
                                  student.daysPresent
                                }</span> days
                            </div>
                        </li>`;
          topAttendantList.innerHTML += listItem;
        });
      } else {
        topAttendantList.innerHTML = "<li>No attendant data available.</li>";
      }
    }

    // --- CALENDAR LOGIC ---
    let date = new Date();
    let currentMonth = date.getMonth();
    let currentYear = date.getFullYear();

    function generateCalendar(month, year) {
      calendarDates.innerHTML = "";
      currentMonthYear.innerText = new Date(year, month).toLocaleString(
        "default",
        { month: "long", year: "numeric" }
      );
      let firstDay = new Date(year, month, 1).getDay();
      let totalDays = new Date(year, month + 1, 0).getDate();
      for (let i = 0; i < firstDay; i++) {
        calendarDates.appendChild(document.createElement("div"));
      }
      for (let day = 1; day <= totalDays; day++) {
        let dateDiv = document.createElement("div");
        dateDiv.classList.add("date");
        dateDiv.innerText = day;
        if (
          day === date.getDate() &&
          month === date.getMonth() &&
          year === date.getFullYear()
        ) {
          dateDiv.classList.add("today");
        }
        calendarDates.appendChild(dateDiv);
      }
    }

    prevMonthBtn.addEventListener("click", () => {
      if (currentMonth === 0) {
        currentMonth = 11;
        currentYear--;
      } else {
        currentMonth--;
      }
      generateCalendar(currentMonth, currentYear);
    });

    nextMonthBtn.addEventListener("click", () => {
      if (currentMonth === 11) {
        currentMonth = 0;
        currentYear++;
      } else {
        currentMonth++;
      }
      generateCalendar(currentMonth, currentYear);
    });

    // --- INITIALIZATION ---
    filterButton.addEventListener("click", updateDashboard);
    dateFilter.value = "today";
    updateDashboard();
    generateCalendar(currentMonth, currentYear);
  }

  /**
   * Initializes all functionality for the ATTENDANCE page.
   */
  function initializeAttendancePage() {
    const attendanceApi = `${API_BASE_URL}/attendance`;
    let state = {
      searchTerm: "",
      status: "",
      startDate: "",
      endDate: "",
      currentPage: 1,
      rowsPerPage: 10,
      totalPages: 1,
    };
    let allRecords = []; // To store all data for exporting

    const tbody = document.querySelector("#attendanceTable tbody");
    const searchInput = document.getElementById("searchInput");
    const searchButton = document.getElementById("searchButton");
    const statusFilter = document.getElementById("statusFilter");
    const startDateInput = document.getElementById("startDate");
    const endDateInput = document.getElementById("endDate");
    const clearFiltersBtn = document.getElementById("clearFiltersBtn");
    const loadingIndicator = document.getElementById("loadingIndicator");
    const tableContainer = document.querySelector(".table-container");
    const tableMessage = document.getElementById("tableMessage");
    const paginationControls = document.getElementById("paginationControls");
    const exportCsvBtn = document.getElementById("exportCsvBtn");
    const exportExcelBtn = document.getElementById("exportExcelBtn");
    const exportPdfBtn = document.getElementById("exportPdfBtn");

    async function fetchAttendanceData() {
      showLoading(true);
      updateStateFromInputs();
      const params = new URLSearchParams({
        page: state.currentPage,
        limit: state.rowsPerPage,
        search: state.searchTerm,
        status: state.status,
        startDate: state.startDate,
        endDate: state.endDate,
      });
      try {
        const response = await fetch(`${attendanceApi}?${params}`);
        if (!response.ok)
          throw new Error(`Server error: ${response.statusText}`);
        const data = await response.json();
        state.totalPages = data.totalPages;
        renderTable(data.records);
        renderPagination();
      } catch (error) {
        console.error("Failed to fetch data:", error);
        showMessage("Couldn't connect to the server. Please try again later.");
      } finally {
        showLoading(false);
      }
    }

    function renderTable(records) {
      tbody.innerHTML = "";
      if (records.length === 0) {
        showMessage("No attendance records found for the selected filters.");
        return;
      }
      records.forEach((entry) => {
        const row = document.createElement("tr");
        row.innerHTML = `
                    <td>${entry.name}</td>
                    <td>${entry.studentId}</td>
                    <td>${entry.department}</td>
                    <td>${new Date(entry.date).toLocaleDateString()}</td>
                    <td>${entry.timeIn || "-"}</td>
                    <td><span class="badge ${entry.status.toLowerCase()}">${
          entry.status
        }</span></td>
                `;
        tbody.appendChild(row);
      });
    }

    function renderPagination() {
      paginationControls.innerHTML = "";
      if (state.totalPages <= 1) return;
      paginationControls.innerHTML = `
                <span class="page-info">Page ${state.currentPage} of ${
        state.totalPages
      }</span>
                <div>
                    <button id="prevPageBtn" ${
                      state.currentPage === 1 ? "disabled" : ""
                    }>Previous</button>
                    <button id="nextPageBtn" ${
                      state.currentPage === state.totalPages ? "disabled" : ""
                    }>Next</button>
                </div>`;
      document.getElementById("prevPageBtn")?.addEventListener("click", () => {
        state.currentPage--;
        fetchAttendanceData();
      });
      document.getElementById("nextPageBtn")?.addEventListener("click", () => {
        state.currentPage++;
        fetchAttendanceData();
      });
    }

    function showLoading(isLoading) {
      loadingIndicator.style.display = isLoading ? "block" : "none";
      tableContainer.style.display = isLoading ? "none" : "block";
      tableMessage.style.display = "none";
      paginationControls.style.display = isLoading ? "none" : "flex";
    }

    function showMessage(message) {
      tableMessage.textContent = message;
      tableMessage.style.display = "block";
      tbody.innerHTML = "";
    }

    function updateStateFromInputs() {
      state.searchTerm = searchInput.value.trim();
      state.status = statusFilter.value;
      state.startDate = startDateInput.value;
      state.endDate = endDateInput.value;
    }

    async function fetchAllDataForExport() {
      showLoading(true);
      updateStateFromInputs();
      const params = new URLSearchParams({
        search: state.searchTerm,
        status: state.status,
        startDate: state.startDate,
        endDate: state.endDate,
        fetchAll: true,
      });
      try {
        const response = await fetch(`${attendanceApi}?${params}`);
        if (!response.ok) throw new Error("Failed to fetch data for export");
        const data = await response.json();
        return data.records;
      } catch (error) {
        console.error(error);
        alert("Could not fetch data for export.");
        return [];
      } finally {
        showLoading(false);
      }
    }

    searchButton.addEventListener("click", () => {
      state.currentPage = 1;
      fetchAttendanceData();
    });
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        state.currentPage = 1;
        fetchAttendanceData();
      }
    });
    statusFilter.addEventListener("change", () => {
      state.currentPage = 1;
      fetchAttendanceData();
    });
    startDateInput.addEventListener("change", () => {
      state.currentPage = 1;
      fetchAttendanceData();
    });
    endDateInput.addEventListener("change", () => {
      state.currentPage = 1;
      fetchAttendanceData();
    });
    clearFiltersBtn.addEventListener("click", () => {
      searchInput.value = "";
      statusFilter.value = "";
      startDateInput.value = "";
      endDateInput.value = "";
      state.currentPage = 1;
      fetchAttendanceData();
    });

    //====================================================================================================================
    //=========================CSV, EXCEL, PDF DOWNLOAD FUNCTIONALITY ====================================================
    // ===================================================================================================================
    exportCsvBtn.addEventListener("click", async () => {
      const dataToExport = await fetchAllDataForExport();
      if (dataToExport.length === 0) return alert("No data to export.");
      let csv = "Name,Student ID,Department,Date,Time In,Status\n";
      dataToExport.forEach((e) => {
        csv += `"${e.name}","${e.studentId}","${e.department}","${new Date(
          e.date
        ).toLocaleDateString()}","${e.timeIn || "-"}","${e.status}"\n`;
      });
      const blob = new Blob([csv], { type: "text/csv" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "attendance.csv";
      link.click();
    });

    exportExcelBtn.addEventListener("click", async () => {
      // 2. Fetch all the records that match the current filters
      const dataToExport = await fetchAllDataForExport();

      // 3. Check if there is data to export
      if (dataToExport.length === 0) {
        alert("No data available to export based on the current filters.");
        return;
      }

      // 4. Map the data to a more user-friendly format for the spreadsheet
      const mappedData = dataToExport.map((record) => ({
        Name: record.name,
        "Student ID": record.studentId,
        Department: record.department,
        Date: new Date(record.date).toLocaleDateString(),
        "Time In": record.timeIn || "-", // Use '-' if timeIn is not available
        Status: record.status,
      }));

      // 5. Use the XLSX library to create the Excel file
      const worksheet = XLSX.utils.json_to_sheet(mappedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Records"); // Name the sheet

      // 6. Trigger the download in the user's browser
      XLSX.writeFile(workbook, "SmartScan_Attendance_Records.xlsx");
    });

    exportPdfBtn.addEventListener("click", async () => {
      // 2. Fetch all matching records
      const dataToExport = await fetchAllDataForExport();

      if (dataToExport.length === 0) {
        alert("No data available to export based on the current filters.");
        return;
      }

      // 3. Initialize jsPDF. 'p' for portrait, 'mm' for millimeters, 'a4' for page size.
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF("p", "mm", "a4");

      // 4. Define the columns for our table
      const tableColumn = [
        "Name",
        "Student ID",
        "Department",
        "Date",
        "Time In",
        "Status",
      ];

      // 5. Map the data into a simple array of arrays, which is what autoTable needs
      const tableRows = dataToExport.map((record) => [
        record.name,
        record.studentId,
        record.department,
        new Date(record.date).toLocaleDateString(),
        record.timeIn || "-",
        record.status,
      ]);

      // 6. Use the autoTable plugin to generate the table in the PDF
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 20,
        theme: "grid",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [34, 197, 94] }, // Green color for the header
      });

      // 7. Add a title to the document
      doc.setFontSize(14);
      doc.text("SmartScan Attend - Attendance Records", 14, 15);

      // 8. Trigger the download
      doc.save("SmartScan_Attendance_Records.pdf");
    });

    fetchAttendanceData();
  }

  // /**
  //  * Initializes all functionality for the MANAGE page.
  //  */
  /**
   * Initializes all functionality for the MANAGE page.
   * This is the fully refactored and corrected version.
   */
  function initializeManagePage() {
    // =================================================================================
    // 1. PAGE-LEVEL VARIABLES & STATE
    // =================================================================================
    let currentStudentId = null;
    let summaryChart;
    let fingerprintCheckInterval;

    // department map
    const departmentMap = {
      MAT: "Material Engineering",
      MAR: "Marine Engineering",
      MEC: "Mechanical Engineering",
      MTE: "Mechatronics Engineering",
      CPE: "Computer Engineering",
      EEE: "Electrical Engineering",
      STE: "Structural Engineering",
      IND: "Industrial Engineering",
      CVE: "Civil Engineering",
      AGE: "Agricultural Engineering",
      PET: "Petroluem Engineering",
      GME: "Geomatics Engineering",
    };

    // =================================================================================
    // 2. ELEMENT REFERENCES
    // =================================================================================
    // --- Search Bar ---
    const studentSearchInput = document.getElementById("studentSearchInput");
    const studentSearchButton = document.getElementById("studentSearchBtn");

    // --- Page Sections ---
    const studentDetailsSection = document.getElementById(
      "studentDetailsSection"
    );
    const dashboardGridSection = document.getElementById(
      "dashboardGridSection"
    );
    const studentSearchPlaceholder = document.getElementById(
      "studentSearchPlaceholder"
    );

    // --- Student Details Card ---
    const studentNameElement = document.getElementById("studentName");
    const studentIdElement = document.getElementById("studentId");
    const studentAvatarImage = document.getElementById("studentAvatarImg");
    const studentDepartmentElement = document.getElementById("studentDept");
    const studentPhoneElement = document.getElementById("studentPhone");
    const studentEmailElement = document.getElementById("studentEmail");

    // --- Statistics Card & Actions ---
    const statsPeriodDropdown = document.getElementById("statsPeriod");
    const downloadButton = document.getElementById("downloadStudentDataBtn");
    const attendanceStatElement = document.getElementById("stat-attendance");
    const absentStatElement = document.getElementById("stat-absent");

    // --- Summary Chart ---
    const summaryCardHeader = document.getElementById("summaryCardHeader");
    const summaryChartCanvas = document
      .getElementById("summaryChart")
      .getContext("2d");

    // --- Top Students Table ---
    const topStudentsTableBody = document.querySelector(
      "#top-students-table tbody"
    );

    // --- Registration Modal ---
    const openModalButton = document.querySelector(".register-student-btn");
    const closeModalButton = document.querySelector(".close-modal-btn");
    const modalOverlay = document.querySelector(".modal-parent-container");
    const studentRegistrationForm = document.getElementById("student-form");
    const registrationStatusBox = document.getElementById("status-box");
    const registrationStatusText = document.getElementById("status-text");
    const registrationSpinner = document.getElementById("spinner");

    // =================================================================================
    // 3. UI MANIPULATION FUNCTIONS
    // =================================================================================

    function showStudentInformation(studentData) {
      studentSearchPlaceholder.style.display = "none";
      studentDetailsSection.style.display = "block";
      dashboardGridSection.style.display = "grid";

      const personalInfo = studentData.personalInfo;
      studentNameElement.textContent = personalInfo.name;
      studentIdElement.textContent = `ID: ${personalInfo.mat_no.toUpperCase()}`;
      studentAvatarImage.src =
        personalInfo.avatarUrl || "images/default-avatar.png";
      studentDepartmentElement.textContent =
        departmentMap[personalInfo.department] || personalInfo.department;
      studentPhoneElement.textContent = personalInfo.phone;
      studentEmailElement.textContent = personalInfo.email;
      summaryCardHeader.textContent = `Summary - ${
        personalInfo.name.split(" ")[0]
      }`;

      updateStatCards(studentData.stats);
      createOrUpdateSummaryChart(studentData.summaryChart);
    }

    function showStudentNotFound(searchedId) {
      studentDetailsSection.style.display = "none";
      dashboardGridSection.style.display = "none";
      studentSearchPlaceholder.style.display = "block";
      studentSearchPlaceholder.querySelector(
        "p"
      ).textContent = `No student found with Matriculation No: ${searchedId}`;
      currentStudentId = null;
    }

    function updateStatCards(stats) {
      attendanceStatElement.textContent = `${stats.totalAttendance} Days`;
      absentStatElement.textContent = `${stats.totalAbsent} Days`;
    }

    function fillTopStudentsTable(studentList) {
      topStudentsTableBody.innerHTML = "";
      if (!studentList || studentList.length === 0) {
        topStudentsTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No data available.</td></tr>`;
        return;
      }
      studentList.forEach((student, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${index + 1}</td><td>${student.name}</td><td>${
          student.mat_no
        }</td><td>${student.daysPresent}</td>`;
        topStudentsTableBody.appendChild(row);
      });
    }

    function createOrUpdateSummaryChart(chartData) {
      if (summaryChart) {
        summaryChart.destroy();
      }
      summaryChart = new Chart(summaryChartCanvas, {
        type: "bar",
        data: {
          labels: chartData.labels,
          datasets: [
            {
              label: "Attendance Days",
              data: chartData.data,
              backgroundColor: "rgba(34, 197, 94, 0.2)",
              borderColor: "#22C55E",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } },
        },
      });
    }

    function updateRegistrationStatus(type, message) {
      registrationStatusBox.className = "status-box";
      registrationStatusBox.classList.add(`status-${type}`);
      registrationSpinner.style.display =
        type === "scanning" ? "block" : "none";
      registrationStatusText.textContent = message;
    }

    // =================================================================================
    // 4. API & LOGIC FUNCTIONS (Refactored to async/await for clarity)
    // =================================================================================

    async function handleSearch() {
      const studentIdToSearch = studentSearchInput.value.trim().toUpperCase();
      if (!studentIdToSearch) {
        alert("Please enter a student matriculation number.");
        return;
      }
      try {
        const response = await fetch(
          `${API_BASE_URL}/students/${studentIdToSearch}`
        );
        if (response.status === 404) {
          showStudentNotFound(studentIdToSearch);
          return;
        }
        if (!response.ok) throw new Error("Server error!");
        const data = await response.json();
        currentStudentId = studentIdToSearch;
        showStudentInformation(data);
      } catch (error) {
        console.error("Search failed:", error);
        alert("Could not perform search. Please check the server connection.");
      }
    }

    async function getTopStudents() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/analytics/top-attendants-semester`
        );
        const studentList = await response.json();
        fillTopStudentsTable(studentList);
      } catch (error) {
        console.error("Could not get top students:", error);
      }
    }

    async function getUpdatedStats() {
      if (!currentStudentId) return;
      const selectedPeriod = statsPeriodDropdown.value;
      try {
        const response = await fetch(
          `${API_BASE_URL}/students/${currentStudentId}/stats?period=${selectedPeriod}`
        );
        const stats = await response.json();
        updateStatCards(stats);
      } catch (error) {
        console.error("Could not update stats:", error);
      }
    }

    //================ PDF DOWNLOAD FUNCTION ======================
    async function downloadAttendanceAsPDF() {
      if (!currentStudentId) return alert("Please search for a student first.");

      const period = statsPeriodDropdown.value;
      downloadButton.textContent = "Preparing...";
      downloadButton.disabled = true;

      try {
        const response = await fetch(
          `${API_BASE_URL}/students/${currentStudentId}/records?period=${period}`
        );
        if (!response.ok) throw new Error("Failed to fetch records.");

        const records = await response.json();
        if (records.length === 0) {
          alert(`No attendance records to download for this ${period}.`);
          return; // Important: return here so it doesn't proceed
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const tableColumn = ["Date", "Time In", "Status"];
        const tableRows = records.map((rec) => [
          new Date(rec.date).toLocaleDateString(),
          rec.timeIn || "-",
          rec.status,
        ]);

        const studentName = studentNameElement.textContent;
        const studentId = studentIdElement.textContent;

        // Add a title and student info to the PDF
        doc.setFontSize(16);
        doc.text("Student Attendance Record", 14, 22);
        doc.setFontSize(11);
        doc.text(`Name: ${studentName}`, 14, 30);
        doc.text(`${studentId}`, 14, 36);

        // Use the autoTable plugin to draw the table
        doc.autoTable({
          head: [tableColumn],
          body: tableRows,
          startY: 42, // Start the table below the title
          theme: "grid",
          headStyles: { fillColor: [34, 197, 94] }, // Green header
        });

        const fileName = `Attendance_${studentName.replace(
          /\s/g,
          "_"
        )}_${period}.pdf`;
        doc.save(fileName);
      } catch (error) {
        console.error("Download failed:", error);
        alert("An error occurred during download.");
      } finally {
        // This block runs whether the download succeeded or failed
        downloadButton.textContent = "Download";
        downloadButton.disabled = false;
      }
    }

    //===================  FINGERPRINT REGISTRATION =========================
    async function checkForFingerprint() {
      try {
        const response = await fetch(`${API_BASE_URL}/pending-fingerprint`);
        const data = await response.json();
        if (data.fingerprint_id) {
          clearInterval(fingerprintCheckInterval);
          updateRegistrationStatus(
            "success",
            "Fingerprint received! Registering..."
          );
          await registerNewStudent(data.fingerprint_id);
        }
      } catch (error) {
        console.error("Polling error:", error);
        clearInterval(fingerprintCheckInterval);
        updateRegistrationStatus(
          "error",
          "Could not connect to the device or server."
        );
      }
    }

    async function registerNewStudent(fingerprintId) {
      try {
        const name = document.getElementById("regName").value;
        const mat_no = document.getElementById("regMatNo").value;
        const email = document.getElementById("regEmail").value;
        const phone = document.getElementById("regPhone").value;
        const department = document.getElementById("regDepartment").value;
        const gender = document.querySelector(
          'input[name="gender"]:checked'
        ).value;

        const studentData = {
          name,
          mat_no,
          email,
          phone,
          department,
          gender,
          fingerprint_id: fingerprintId,
        };

        // 2. Make the final POST request to the server
        const response = await fetch(`${API_BASE_URL}/register-student`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(studentData),
        });

        const result = await response.json();

        // 3. Handle the server's response
        if (!response.ok) {
          // response.ok is false for server errors like 400, 409, 500
          console.error("Server responded with an error:", result.message);
          updateRegistrationStatus(
            "error",
            `Registration Failed: ${result.message}`
          );
        } else {
          // Success! The server responded with 201 (Created)
          console.log("Registration successful:", result.message);
          updateRegistrationStatus(
            "success",
            `${studentData.name} has been registered successfully!`
          );
        }
      } catch (error) {
        // This 'catch' handles network errors (like if the server is down)
        console.error("Failed to send registration data:", error);
        updateRegistrationStatus(
          "Could not connect to the server to finalize registration."
        );
      }
    }

    function handleResize() {
      if (openModalButton) {
        openModalButton.disabled = window.innerWidth < 768;
      }
    }

    // =================================================================================
    // 5. EVENT LISTENERS
    // =================================================================================
    studentSearchButton.addEventListener("click", handleSearch);
    studentSearchInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") handleSearch();
    });
    statsPeriodDropdown.addEventListener("change", getUpdatedStats);
    downloadButton.addEventListener("click", downloadAttendanceAsPDF); // Changed to PDF function

    // --- Modal & Registration Listeners ---
    openModalButton.addEventListener("click", () => {
      modalOverlay.classList.add("show");
      studentRegistrationForm.reset();
      updateRegistrationStatus(
        "waiting",
        "Fill in the details to begin registration."
      );
      studentRegistrationForm
        .querySelectorAll("input, select, button")
        .forEach((el) => (el.disabled = false));
    });

    closeModalButton.addEventListener("click", () => {
      modalOverlay.classList.remove("show");
      clearInterval(fingerprintCheckInterval);
    });

    studentRegistrationForm.addEventListener("submit", (event) => {
      event.preventDefault();
      studentRegistrationForm
        .querySelectorAll("input, select, button")
        .forEach((el) => (el.disabled = true));
      updateRegistrationStatus(
        "scanning",
        "Waiting for finger scan on the device..."
      );
      fingerprintCheckInterval = setInterval(checkForFingerprint, 5000);
    });

    // --- Disable on Mobile Listener ---
    window.addEventListener("load", handleResize);
    window.addEventListener("resize", handleResize);

    // =================================================================================
    // 6. INITIALIZATION
    // =================================================================================
    console.log("Manage Students page is ready.");
    studentDetailsSection.style.display = "none";
    dashboardGridSection.style.display = "none";
    studentSearchPlaceholder.style.display = "block";
    getTopStudents();
    handleResize(); // Run once on load to set the initial button state
  }

  /**
   * Initializes all functionality for the LOGS page.
   */
  function initializeLogsPage() {
    const logsApi = `${API_BASE_URL}/logs`;
    const POLLING_INTERVAL = 5000;
    let pollingTimer;
    let displayedLogIds = new Set();

    const refreshSpinner = document.getElementById("refresh-spinner");
    const tableBody = document.getElementById("logsTableBody");
    const refreshBtn = document.getElementById("refreshBtn");
    const exportBtn = document.getElementById("exportBtn");

    async function fetchLogs() {
      try {
        const response = await fetch(logsApi);
        if (!response.ok) throw new Error("Failed to fetch logs");
        const logs = await response.json();
        updateTable(logs);
      } catch (error) {
        console.error("Error fetching logs:", error);
      }
    }

    async function refreshLogs() {
      refreshBtn.classList.add("loading");
      refreshSpinner.style.display = "block";
      refreshBtn.disabled = true;
      tableBody.innerHTML = "";
      displayedLogIds.clear();

      await fetchLogs();
      refreshBtn.classList.remove("loading");
      refreshBtn.disabled = false;
      refreshSpinner.style.display = "none";
    }

    function updateTable(logs) {
      if (!logs || logs.length === 0) {
        if (tableBody.children.length === 0) {
          tableBody.innerHTML = `<tr><td colspan="5" class="empty-placeholder">No log entries found.</td></tr>`;
        }
        return;
      }
      if (tableBody.querySelector(".empty-placeholder")) {
        tableBody.innerHTML = "";
      }
      for (let i = logs.length - 1; i >= 0; i--) {
        const log = logs[i];
        if (!displayedLogIds.has(log.id)) {
          const row = createTableRow(log);
          tableBody.prepend(row);
          displayedLogIds.add(log.id);
          row.classList.add("new-log-entry");
          setTimeout(() => row.classList.remove("new-log-entry"), 1000);
        }
      }
    }

    function createTableRow(log) {
      const row = document.createElement("tr");
      const statusClass = `status-${log.status.toLowerCase()}`;
      const formattedTimestamp = log.timestamp
        ? new Date(log.timestamp).toLocaleString()
        : "—";
      row.innerHTML = `<td>${log.name}</td><td>${log.studentId}</td><td class="${statusClass}">${log.status}</td><td>${log.gender}</td><td>${formattedTimestamp}</td>`;
      return row;
    }

    //============================================================================================
    //======================= LOGS EXPORT FUNCTIONALITY  =========================================
    function exportLogs() {
      // Select all the rows currently visible in the table body
      const rows = tableBody.querySelectorAll("tr");

      // Check if there's nothing to export
      if (rows.length === 0 || tableBody.querySelector(".empty-placeholder")) {
        alert("There are no logs to export.");
        return;
      }

      alert("Preparing PDF of the current logs...");

      // Initialize jsPDF
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF("p", "mm", "a4");

      // Define the columns for our PDF table
      const tableColumn = [
        "Name",
        "Student ID",
        "Status",
        "Gender",
        "Timestamp",
      ];

      // Extract the text from the HTML table and format it for autoTable
      const tableRows = [];
      rows.forEach((row) => {
        const rowData = [];
        // Get the text from each cell (<td>) in the current row
        const cells = row.querySelectorAll("td");
        cells.forEach((cell) => {
          rowData.push(cell.innerText);
        });
        tableRows.push(rowData);
      });

      // Generate the table using the autoTable plugin
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 20,
        theme: "grid",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [22, 160, 133] }, // A teal color for the log header
      });

      // Add a title to the document
      doc.setFontSize(14);
      doc.text("SmartScan Attend - Activity Logs", 14, 15);

      // Trigger the download
      doc.save("SmartScan_Activity_Logs.pdf");
    }

    refreshBtn.addEventListener("click", refreshLogs);
    exportBtn.addEventListener("click", exportLogs);

    refreshLogs();
    pollingTimer = setInterval(fetchLogs, POLLING_INTERVAL);
  }

  function initializeSettingsPage() {
    // --- 1. ELEMENT REFERENCES ---
    const sidebarLinks = document.querySelectorAll(".sidebar-link");
    const contentPanes = document.querySelectorAll(".settings-pane");

    // Modals
    const editProfileModal = document.getElementById("editProfileModal");
    const addUserModal = document.getElementById("addUserModal");
    const manageDeviceModal = document.getElementById("manageDeviceModal");
    const resetDataModal = document.getElementById("resetDataModal");
    const deleteConfirmModal = document.getElementById("deleteConfirmModal");

    // Buttons
    const openEditModalBtn = document.getElementById("openEditModalBtn");
    const addUserBtn = document.getElementById("addUserBtn");
    const openResetModalBtn = document.getElementById("openResetModalBtn");
    const openDeleteModalBtn = document.getElementById("openDeleteModalBtn");

    // Dynamic Content Areas
    const usersTableBody = document.getElementById("usersTableBody");
    const accessLogsTableBody = document.getElementById("accessLogsTableBody");
    const devicesTableBody = document.getElementById("devicesTableBody");
    const twoFactorToggle = document.getElementById("twoFactorToggle");
    const exportCsvBtn = document.getElementById("exportCsvBtn");

    // --- 2. API & DATA FETCHING FUNCTIONS ---

    async function fetchUsers() {
      usersTableBody.innerHTML = `<tr><td colspan="5" class="placeholder">Loading users...</td></tr>`;
      // This is a placeholder for a real API call
      // const response = await fetch(`${API_BASE_URL}/users`);
      // const users = await response.json();

      // Simulating a delay and fake data
      setTimeout(() => {
        const fakeUsers = [
          {
            name: "Prof Agbonze Leonard",
            email: "leonardexample@gmail.com",
            avatar: "images/img1.jpg",
            status: "Active",
            level: 2,
            lastLogin: "Apr 15, 2024",
          },
          {
            name: "Dr. Eleanor Vance",
            email: "eleanor.v@example.com",
            avatar: "images/img1.jpg",
            status: "Active",
            level: 1,
            lastLogin: "Apr 14, 2024",
          },
          {
            name: "Mr. Ben Carter",
            email: "ben.c@example.com",
            avatar: "images/img1.jpg",
            status: "Inactive",
            level: 1,
            lastLogin: "Jan 05, 2024",
          },
        ];
        renderUsers(fakeUsers);
      }, 500);
    }

    async function fetchAccessLogs() {
      // ... Similar API call logic would go here
      const fakeLogs = `
            <tr><td><strong>Login from Chrome on Windows</strong><br>IP: 192.168.1.10 - Apr 15, 2024, 10:30 AM</td></tr>
            <tr><td><strong>Password Change</strong><br>IP: 192.168.1.10 - Apr 12, 2024, 08:00 AM</td></tr>`;
      accessLogsTableBody.innerHTML = fakeLogs;
    }

    async function fetchDevices() {
      devicesTableBody.innerHTML = `<tr><td colspan="5" class="placeholder">Loading devices...</td></tr>`;
      // ... API call to `${API_BASE_URL}/devices`
      setTimeout(() => {
        const fakeDevices = [
          {
            name: "Main Entrance Scanner",
            status: "Online",
            lastSync: "Just now",
            firmware: "v1.8",
          },
          {
            name: "Workshop Scanner",
            status: "Offline",
            lastSync: "2 hours ago",
            firmware: "v1.7",
          },
        ];
        renderDevices(fakeDevices);
      }, 500);
    }

    // --- 3. UI RENDERING FUNCTIONS ---

    function renderUsers(users) {
      usersTableBody.innerHTML = "";
      if (users.length === 0) {
        usersTableBody.innerHTML = `<tr><td colspan="5" class="placeholder">No users found.</td></tr>`;
        return;
      }
      users.forEach((user) => {
        const levelBadge =
          user.level === 2
            ? `<span class="access-badge level-2">Level 2 (Admin)</span>`
            : `<span class="access-badge level-1">Level 1 (Lecturer)</span>`;
        const row = `
                <tr>
                    <td><div class="user-cell"><img src="${user.avatar}" alt="Avatar"><div><p class="user-name">${user.name}</p><p class="user-email">${user.email}</p></div></div></td>
                    <td><span class="status-badge">${user.status}</span></td>
                    <td>${levelBadge}</td>
                    <td>${user.lastLogin}</td>
                    <td><button class="edit-btn small">Edit</button></td>
                </tr>`;
        usersTableBody.innerHTML += row;
      });
    }

    function renderDevices(devices) {
      devicesTableBody.innerHTML = "";
      devices.forEach((device) => {
        const row = `
                <tr>
                    <td><p class="device-name">${device.name}</p></td>
                    <td><span class="status-badge ${device.status.toLowerCase()}">${
          device.status
        }</span></td>
                    <td>${device.lastSync}</td>
                    <td>${device.firmware}</td>
                    <td><button class="edit-btn small" data-action="manageDevice">Manage</button></td>
                </tr>`;
        devicesTableBody.innerHTML += row;
      });
    }

    // --- 4. MODAL MANAGEMENT ---
    const allModals = document.querySelectorAll(".modal-overlay");
    function openModal(modal) {
      if (modal) modal.classList.add("show");
    }
    function closeModal(modal) {
      if (modal) modal.classList.remove("show");
    }
    allModals.forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal || e.target.closest("[data-close]")) {
          closeModal(modal);
        }
      });
    });

    // --- 5. EVENT LISTENERS ---

    // Tab Switching
    sidebarLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = link.getAttribute("data-target");

        sidebarLinks.forEach((l) => l.classList.remove("current"));
        link.classList.add("current");

        contentPanes.forEach((pane) => pane.classList.remove("current"));
        document.getElementById(targetId)?.classList.add("current");

        // Fetch data for the newly opened tab
        if (targetId === "users") fetchUsers();
        if (targetId === "security") fetchAccessLogs();
        if (targetId === "device") fetchDevices();
      });
    });

    // Button Clicks
    openEditModalBtn.addEventListener("click", () =>
      openModal(editProfileModal)
    );
    addUserBtn.addEventListener("click", () => openModal(addUserModal));
    openResetModalBtn.addEventListener("click", () =>
      openModal(resetDataModal)
    );
    openDeleteModalBtn.addEventListener("click", () =>
      openModal(deleteConfirmModal)
    );

    twoFactorToggle.addEventListener("change", () => {
      alert(
        `2FA has been ${twoFactorToggle.checked ? "ENABLED" : "DISABLED"}.`
      );
      // API call to update this setting would go here
    });

    exportCsvBtn.addEventListener("click", () => {
      alert("System-wide CSV export initiated...");
      // API call to a special export endpoint would go here
    });

    // Dynamic listener for buttons inside tables (like "Manage Device")
    document.addEventListener("click", (e) => {
      if (e.target.matches('[data-action="manageDevice"]')) {
        openModal(manageDeviceModal);
      }
    });

    // --- 6. INITIALIZATION ---
    console.log("Settings Page script loaded and initialized.");
    // No initial data fetch, as "My Profile" is static. Data is fetched when tabs are clicked.
  }
});
