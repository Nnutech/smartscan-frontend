// This lets the javascript code run after the HTML document is fully loaded
// main.js

document.addEventListener('DOMContentLoaded', () => {

    const API_BASE_URL = 'http://localhost:3000/api/analytics';

    //Hamburger menu section 
    const menuBtn = document.getElementById('menuBtn');
    const closeBtn = document.getElementById('closeBtn');
    const heading = document.querySelector('.heading');

    menuBtn.addEventListener('click', () => {
        heading.classList.add('active');
    });

    closeBtn.addEventListener('click', () => {
        heading.classList.remove('active');
    });


    //calendar tracking section to display the current day and year
    const calendarDates = document.getElementById("calendarDates");
    const currentMonthYear = document.getElementById("currentMonthYear");
    const prevMonthBtn = document.getElementById("prevMonth");
    const nextMonthBtn = document.getElementById("nextMonth");

    let date = new Date();
    let currentMonth = date.getMonth();
    let currentYear = date.getFullYear();

    function generateCalendar(month, year) {
        calendarDates.innerHTML = ""; // Clear previous dates
        currentMonthYear.innerText = new Date(year, month).toLocaleString("default", {
            month: "long",
            year: "numeric",
        });

        let firstDay = new Date(year, month, 1).getDay();
        let totalDays = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDay; i++) {
            let emptyDiv = document.createElement("div");
            calendarDates.appendChild(emptyDiv);
        }

        for (let day = 1; day <= totalDays; day++) {
            let dateDiv = document.createElement("div");
            dateDiv.classList.add("date");
            dateDiv.innerText = day;

            if (day === date.getDate() && month === date.getMonth() && year === date.getFullYear()) {
                dateDiv.classList.add("today");
            }

            calendarDates.appendChild(dateDiv);
        }
    }

    prevMonthBtn.addEventListener("click", function () {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        generateCalendar(currentMonth, currentYear);
    });

    nextMonthBtn.addEventListener("click", function () {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        generateCalendar(currentMonth, currentYear);
    });

    generateCalendar(currentMonth, currentYear);


    /// =================================    ANALYTICS PAGE CODE SECTION     ================================= ======================================================================================================= ///

    // --- CHART INITIALIZATION ---
    // We initialize the charts once with empty data.
    // We will update them with data from the server.

    // Main Attendance Line Chart
    const attendanceChartCtx = document.getElementById('attendanceChart').getContext('2d');
    const attendanceChart = new Chart(attendanceChartCtx, {
        type: 'line',
        data: {
            labels: ['Jan 1', 'Jan 2', 'Jan 5', 'Jan 10', 'Jan 12', 'Jan 15', 'Jan 20', 'Jan 25'],
            datasets: [{
                label: 'Total attendance report',
                data: [10, 47, 44, 35, 23, 12, 46, 60],
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                borderColor: '#22C55E',
                borderWidth: 2,
                tension: 0.4, // curve
                fill: true,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });

    // Students by Gender Doughnut Chart
    let maleCount = 25;
    let femaleCount = 22;

    const genderChartCtx = document.getElementById('students-gender-chart').getContext('2d');
    const genderChart = new Chart(genderChartCtx, {
        type: 'doughnut',
        data: {
            labels: [`Male ${maleCount}`, `Female ${femaleCount}`],
            datasets: [{
                data: [maleCount, femaleCount],
                backgroundColor: ["#2ECC71", "#2C3E50"],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: true, position: 'bottom' } }
        }
    });

    // Weekly Absent Radar Chart
    let absentData = [10, 20, 15, 12, 25, 8, 18];
    const weeklyAbsentCtx = document.getElementById('weekly-absent').getContext('2d');
    const weeklyAbsentChart = new Chart(weeklyAbsentCtx, {
        type: 'radar',
        data: {
            labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
            datasets: [{
                label: "Absentees",
                data: absentData,
                backgroundColor: "rgba(46, 204, 113, 0.2)",
                borderColor: "#2ECC71",
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });



    // --- DOM ELEMENT SELECTORS ---
    const filterButton = document.querySelector('.filter-button');
    const classFilter = document.getElementById('classFilter');
    const dateFilter = document.getElementById('dateFilter');

    const totalStudentsValue = document.querySelector('.total-students .attendance-value');
    const presentTodayValue = document.querySelector('.present-today .attendance-value');
    const absentTodayValue = document.querySelector('.absent-today .attendance-value');
    const topAttendantList = document.querySelector('.top-attendant-list');


    // --- DATA FETCHING AND UI UPDATE FUNCTIONS ---

    /**
     * Main function to fetch all dashboard data and update the UI.
     * It is called on page load and when the filter button is clicked.
     */
    async function updateDashboard() {
        const selectedClass = classFilter.value;
        const selectedDateRange = dateFilter.value;

        try {
            // Fetch data from all endpoints concurrently for efficiency
            const [summaryData, attendanceReportData, genderData, topAttendants, weeklyAbsentees] = await Promise.all([
                fetch(`${API_BASE_URL}/summary?class=${selectedClass}&period=${selectedDateRange}`).then(res => res.json()),
                fetch(`${API_BASE_URL}/attendance-report?class=${selectedClass}&period=${selectedDateRange}`).then(res => res.json()),
                fetch(`${API_BASE_URL}/gender-distribution?class=${selectedClass}`).then(res => res.json()),
                fetch(`${API_BASE_URL}/top-attendants?class=${selectedClass}&limit=6`).then(res => res.json()),
                fetch(`${API_BASE_URL}/weekly-absentees?class=${selectedClass}`).then(res => res.json())
            ]);

            // Update the UI with the fetched data
            updateSummaryCards(summaryData);
            updateAttendanceChart(attendanceReportData);
            updateGenderChart(genderData);
            updateTopAttendantsList(topAttendants);
            updateWeeklyAbsentChart(weeklyAbsentees);

        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
            window.error("Failed to fetch dashboard data:", error);
            // You could display an error message to the user on the UI here
        }
    }

    /**
     * Updates the summary cards (Total, Present, Absent).
     * backend endpoint: /api/analytics/summary
     * expected data: { totalStudents: 47, present: 42, absent: 5 }
     */
    function updateSummaryCards(data) {
        totalStudentsValue.textContent = data.totalStudents ?? 'N/A';
        presentTodayValue.textContent = data.present ?? 'N/A';
        absentTodayValue.textContent = data.absent ?? 'N/A';
    }

    /**
     * Updates the main attendance line chart.
     * backend endpoint: /api/analytics/attendance-report
     * expected data: { labels: ['Jan 1', ...], data: [40, ...] }
     */
    function updateAttendanceChart(data) {
        attendanceChart.data.labels = data.labels;
        attendanceChart.data.datasets[0].data = data.data;
        attendanceChart.update();
    }

    /**
     * Updates the student gender doughnut chart.
     * backend endpoint: /api/analytics/gender-distribution
     * expected data: { male: 25, female: 22 }
     */
    function updateGenderChart(data) {
        genderChart.data.labels = [`Male ${data.male}`, `Female ${data.female}`];
        genderChart.data.datasets[0].data = [data.male, data.female];
        genderChart.update();
    }

    /**
     * Updates the weekly absentees radar chart.
     * backend endpoint: /api/analytics/weekly-absentees
     * expected data: { data: [5, 2, 3, 1, 4, 0, 6] } (Sun to Sat)
     */
    function updateWeeklyAbsentChart(data) {
        weeklyAbsentChart.data.datasets[0].data = data.data;
        weeklyAbsentChart.update();
    }

    /**
     * Updates the top 6 attendant students list.
     * backend endpoint: /api/analytics/top-attendants
     * expected data: [ { name: 'Brooks..', daysPresent: 30, imageUrl: 'path/to/img.jpg' }, ... ]
     */
    function updateTopAttendantsList(data) {
        // Clear the existing list
        topAttendantList.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(student => {
                const listItem = `
            <li>
              <div>
                <div class="student-img">
                  <img src="${student.imageUrl || 'images/img1.jpg'}" alt="${student.name}">
                </div>
                <div class="student-name">
                  ${student.name}
                </div>
              </div>
              <div class="present-days">
                <span class="days">${student.daysPresent}</span> days
              </div>
            </li>
          `;
                topAttendantList.innerHTML += listItem;
            });
        } else {
            topAttendantList.innerHTML = '<li>No data available.</li>';
        }
    }

    // --- EVENT LISTENERS ---
    filterButton.addEventListener('click', updateDashboard);

    // --- INITIAL LOAD ---
    // Set default selection and load data when the page first loads.
    dateFilter.value = 'today';
    updateDashboard();
});


/// =================================    ATTENDANCE PAGE CODE SECTION     ================================= ========================================================================================================== ///

// --- STATE MANAGEMENT ---
// A single object to hold the current state of filters and pagination
let state = {
    searchTerm: '',
    status: '',
    startDate: '',
    endDate: '',
    currentPage: 1,
    rowsPerPage: 10,
    totalPages: 1,
    // This will hold the complete data for the current page
    currentPageData: []
};

// --- DOM ELEMENT SELECTORS ---
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

// --- CORE FUNCTIONS ---

/**
 * Fetches data from the backend based on the current state.
 */
async function fetchAttendanceData() {
    showLoading(true);
    updateStateFromInputs();

    // Construct query parameters
    const params = new URLSearchParams({
        page: state.currentPage,
        limit: state.rowsPerPage,
        search: state.searchTerm,
        status: state.status,
        startDate: state.startDate,
        endDate: state.endDate
    });

    try {
        const response = await fetch(`${API_BASE_URL}/attendance?${params}`);
        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }
        const data = await response.json();

        // Assuming the backend returns { records: [...], totalPages: X }
        state.currentPageData = data.records;
        state.totalPages = data.totalPages;

        renderTable();
        renderPagination();

    } catch (error) {
        console.error("Failed to fetch data:", error);
        showMessage("Couldn't connect to the server. Please try again later.");
    } finally {
        showLoading(false);
    }
}

/**
 * Renders the table rows based on the data in the state.
 */
function renderTable() {
    tbody.innerHTML = ""; // Clear existing rows

    if (state.currentPageData.length === 0) {
        showMessage("No attendance records found for the selected filters.");
        return;
    }

    state.currentPageData.forEach(entry => {
        const row = document.createElement("tr");
        row.innerHTML = `
                <td>${entry.name}</td>
                <td>${entry.studentId}</td>
                <td>${entry.department}</td>
                <td>${new Date(entry.date).toLocaleDateString()}</td>
                <td>${entry.timeIn || '-'}</td>
                <td><span class="badge ${entry.status.toLowerCase()}">${entry.status}</span></td>
            `;
        tbody.appendChild(row);
    });
}

/**
 * Renders pagination controls based on the current state.
 */
function renderPagination() {
    paginationControls.innerHTML = ""; // Clear existing controls
    if (state.totalPages <= 1) return;

    paginationControls.innerHTML = `
            <span class="page-info">Page ${state.currentPage} of ${state.totalPages}</span>
            <div>
                <button id="prevPageBtn" ${state.currentPage === 1 ? 'disabled' : ''}>Previous</button>
                <button id="nextPageBtn" ${state.currentPage === state.totalPages ? 'disabled' : ''}>Next</button>
            </div>
        `;

    document.getElementById('prevPageBtn')?.addEventListener('click', () => {
        if (state.currentPage > 1) {
            state.currentPage--;
            fetchAttendanceData();
        }
    });

    document.getElementById('nextPageBtn')?.addEventListener('click', () => {
        if (state.currentPage < state.totalPages) {
            state.currentPage++;
            fetchAttendanceData();
        }
    });
}

// --- UI HELPER FUNCTIONS ---

function showLoading(isLoading) {
    if (isLoading) {
        loadingIndicator.style.display = 'block';
        tableContainer.style.display = 'none';
        tableMessage.style.display = 'none';
        paginationControls.style.display = 'none';
    } else {
        loadingIndicator.style.display = 'none';
        tableContainer.style.display = 'block';
        paginationControls.style.display = 'flex';
    }
}

function showMessage(message) {
    tableMessage.textContent = message;
    tableMessage.style.display = 'block';
    tbody.innerHTML = ""; // Ensure table is empty
}

function updateStateFromInputs() {
    state.searchTerm = searchInput.value.trim();
    state.status = statusFilter.value;
    state.startDate = startDateInput.value;
    state.endDate = endDateInput.value;
}

function clearAllFilters() {
    searchInput.value = "";
    statusFilter.value = "";
    startDateInput.value = "";
    endDateInput.value = "";
    state.currentPage = 1;
    fetchAttendanceData();
}


// --- EVENT LISTENERS ---

// Trigger search on button click or 'Enter' key
searchButton.addEventListener('click', () => {
    state.currentPage = 1; // Reset to first page on new search
    fetchAttendanceData();
});
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        state.currentPage = 1;
        fetchAttendanceData();
    }
});

// Trigger fetch when filters change
statusFilter.addEventListener('change', () => {
    state.currentPage = 1;
    fetchAttendanceData();
});
startDateInput.addEventListener('change', () => {
    state.currentPage = 1;
    fetchAttendanceData();
});
endDateInput.addEventListener('change', () => {
    state.currentPage = 1;
    fetchAttendanceData();
});

// Clear filters button
clearFiltersBtn.addEventListener('click', clearAllFilters);


// --- EXPORT FUNCTIONS ---

// This is a helper function to fetch ALL data for exporting, bypassing pagination
async function fetchAllDataForExport() {
    showLoading(true);
    updateStateFromInputs();
    const params = new URLSearchParams({
        search: state.searchTerm,
        status: state.status,
        startDate: state.startDate,
        endDate: state.endDate,
        fetchAll: true // A special flag for the backend
    });

    try {
        const response = await fetch(`${API_BASE_URL}/attendance?${params}`);
        if (!response.ok) throw new Error('Failed to fetch data for export');
        const data = await response.json();
        return data.records; // Assuming backend returns all records under this key
    } catch (error) {
        console.error(error);
        alert("Could not fetch data for export. Please try again.");
        return []; // Return empty array on failure
    } finally {
        showLoading(false);
    }
}

exportCsvBtn.addEventListener('click', async () => {
    const dataToExport = await fetchAllDataForExport();
    if (dataToExport.length === 0) return alert("No data to export.");

    let csv = "Name,Student ID,Department,Date,Time In,Status\n";
    dataToExport.forEach(e => {
        csv += `"${e.name}","${e.studentId}","${e.department}","${new Date(e.date).toLocaleDateString()}","${e.timeIn || '-'}","${e.status}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'attendance.csv';
    link.click();
});

exportExcelBtn.addEventListener('click', async () => {
    const dataToExport = await fetchAllDataForExport();
    if (dataToExport.length === 0) return alert("No data to export.");

    const mappedData = dataToExport.map(e => ({
        "Name": e.name,
        "Student ID": e.studentId,
        "Department": e.department,
        "Date": new Date(e.date).toLocaleDateString(),
        "Time In": e.timeIn || '-',
        "Status": e.status
    }));
    const worksheet = XLSX.utils.json_to_sheet(mappedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    XLSX.writeFile(workbook, "attendance.xlsx");
});

exportPdfBtn.addEventListener('click', async () => {
    const dataToExport = await fetchAllDataForExport();
    if (dataToExport.length === 0) return alert("No data to export.");

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const tableColumn = ["Name", "Student ID", "Department", "Date", "Time In", "Status"];
    const tableRows = [];

    dataToExport.forEach(item => {
        const rowData = [
            item.name,
            item.studentId,
            item.department,
            new Date(item.date).toLocaleDateString(),
            item.timeIn || '-',
            item.status
        ];
        tableRows.push(rowData);
    });

    doc.autoTable(tableColumn, tableRows, { startY: 20 });
    doc.text("Attendance Records", 14, 15);
    doc.save("attendance.pdf");
});


// --- INITIAL LOAD ---
fetchAttendanceData();



/// =================================    LOGS PAGE CODE SECTION     ================================= ========================================================================================================== ///

const POLLING_INTERVAL = 5000; // Check for new logs every 5 seconds

  // --- DOM ELEMENTS ---
  const tableBody = document.getElementById('logsTableBody');
  const refreshBtn = document.getElementById('refreshBtn');
  const exportBtn = document.getElementById('exportBtn');

  // --- STATE ---
  let pollingTimer; // To hold the setInterval ID
  let displayedLogIds = new Set(); // To prevent duplicate entries

  // =================================================================
  //                          CORE FUNCTIONS
  // =================================================================

  /**
   * Fetches the latest logs from the server.
   * If it's a poll, it only asks for logs since the last check.
   */
  async function fetchLogs() {
    try {
      // For a more efficient system, you'd pass the latest known log timestamp
      // const response = await fetch(`${SERVER_URL}/logs?since=${latestTimestamp}`);
      const response = await fetch(`${SERVER_URL}/logs`); // Simple fetch for now
      if (!response.ok) {
        throw new Error('Failed to fetch logs from server.');
      }
      const logs = await response.json();
      updateTable(logs);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  }

  /**
   * Clears the table and fetches a complete, fresh set of logs.
   */
  async function refreshLogs() {
    console.log('Refreshing logs...');
    refreshBtn.classList.add('loading');
    refreshBtn.disabled = true;

    // Clear existing state
    tableBody.innerHTML = '';
    displayedLogIds.clear();

    await fetchLogs(); // Fetch fresh data

    refreshBtn.classList.remove('loading');
    refreshBtn.disabled = false;
  }

  // =================================================================
  //                         UI UPDATE FUNCTIONS
  // =================================================================

  /**
   * Updates the table with new log entries, adding them to the top.
   * @param {Array<object>} logs - An array of log objects from the server.
   */
  function updateTable(logs) {
    if (!logs || logs.length === 0) {
      if (tableBody.children.length === 0) {
        // Show a placeholder if the table is completely empty
        const placeholderRow = `<tr><td colspan="5" class="empty-placeholder">No log entries found. Waiting for activity...</td></tr>`;
        tableBody.innerHTML = placeholderRow;
      }
      return;
    }
    
    // If the placeholder is showing, remove it
    if (tableBody.querySelector('.empty-placeholder')) {
        tableBody.innerHTML = '';
    }

    // Iterate backwards to prepend in the correct chronological order (newest first)
    for (let i = logs.length - 1; i >= 0; i--) {
      const log = logs[i];
      
      // Check if this log is already displayed to prevent duplicates
      if (!displayedLogIds.has(log.id)) {
        const row = createTableRow(log);
        tableBody.prepend(row); // Add the new row to the TOP of the table
        displayedLogIds.add(log.id); // Mark this ID as displayed

        // Add a temporary class for the CSS animation
        row.classList.add('new-log-entry');
        setTimeout(() => row.classList.remove('new-log-entry'), 1000);
      }
    }
  }

  /**
   * Creates a table row (<tr>) element from a log object.
   * @param {object} log - A single log data object.
   * @returns {HTMLTableRowElement} The created <tr> element.
   */
  function createTableRow(log) {
    const row = document.createElement('tr');
    const statusClass = `status-${log.status.toLowerCase()}`;
    
    // Format the timestamp for readability
    const formattedTimestamp = log.timestamp ? new Date(log.timestamp).toLocaleString() : '—';
    
    row.innerHTML = `
      <td>${log.name}</td>
      <td>${log.studentId}</td>
      <td class="${statusClass}">${log.status}</td>
      <td>${log.gender}</td>
      <td>${formattedTimestamp}</td>
    `;
    return row;
  }

  // =================================================================
  //                       EXPORT FUNCTIONALITY
  // =================================================================

  /**
   * Exports the current data in the table to a CSV file.
   */
  function exportLogs() {
    const rows = tableBody.querySelectorAll('tr');
    if (rows.length === 0 || tableBody.querySelector('.empty-placeholder')) {
        alert('There is no data to export.');
        return;
    }

    const dataForExport = [];
    rows.forEach(row => {
        const columns = row.querySelectorAll('td');
        dataForExport.push({
            "Name": columns[0].innerText,
            "Student ID": columns[1].innerText,
            "Status": columns[2].innerText,
            "Gender": columns[3].innerText,
            "Timestamp": columns[4].innerText
        });
    });

    const worksheet = XLSX.utils.json_to_sheet(dataForExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Logs');
    XLSX.writeFile(workbook, 'attendance_logs.csv');
  }

  // =================================================================
  //                     INITIALIZATION & EVENT LISTENERS
  // =================================================================
  
  // Attach event listeners to the buttons
  refreshBtn.addEventListener('click', refreshLogs);
  exportBtn.addEventListener('click', exportLogs);

  // --- Initial Page Load ---
  console.log("Log page initialized. Fetching initial data...");
  refreshLogs(); // Perform an initial fetch to populate the table

  // Start polling for new data after the initial load
  pollingTimer = setInterval(fetchLogs, POLLING_INTERVAL);
  console.log(`Polling for new logs every ${POLLING_INTERVAL / 1000} seconds.`);