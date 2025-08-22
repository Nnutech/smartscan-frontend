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

const calendarDates = document.getElementById("calendarDates");
const currentMonthYear = document.getElementById("currentMonthYear");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");


//calendar tracking section
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



//logs page updating section 
async function fetchLogs() {
  try {
    const response = await fetch('/api/attendance/logs');
    const data = await response.json();
    updateTable(data);
  } catch (error) {
    console.error('Error fetching logs:', error);
  }
}

function updateTable(logs) {
  const tbody = document.querySelector('tbody');
  tbody.innerHTML = ''; // Clear existing rows

  logs.forEach(log => {
    const tr = document.createElement('tr');

    const statusClass = {
      Present: 'status-present',
      Absent: 'status-absent',
      Late: 'status-late'
    }[log.status] || '';

    tr.innerHTML = `
      <td>${log.name}</td>
      <td>${log.matNo}</td>
      <td class="${statusClass}">${log.status}</td>
      <td>${log.gender}</td>
      <td>${log.timestamp || '—'}</td>
    `;

    tbody.appendChild(tr);
  });
}

// Refresh every 5 seconds
setInterval(fetchLogs, 5000);

// Initial load
fetchLogs();

/**
    * Gathers data from the HTML table and downloads it as a CSV file.
    */
function exportLogs() {
  const table = document.querySelector(".container table");
  if (!table) {
    console.error("Could not find the table to export.");
    return;
  }

  // This helper function handles cells that might contain commas or quotes
  const formatCsvField = (field) => {
    // Trim whitespace from the field
    const trimmedField = field.trim();
    // If the field contains a comma, a double-quote, or a newline, enclose it in double-quotes
    if (trimmedField.includes(',') || trimmedField.includes('"') || trimmedField.includes('\n')) {
      // Escape any existing double-quotes by replacing them with two double-quotes
      const escapedField = trimmedField.replace(/"/g, '""');
      return `"${escapedField}"`;
    }
    return trimmedField;
  };

  const csvRows = [];

  // 1. Get the headers
  const headers = [];
  table.querySelectorAll("thead th").forEach(header => {
    headers.push(formatCsvField(header.innerText));
  });
  csvRows.push(headers.join(','));

  // 2. Get the body rows
  table.querySelectorAll("tbody tr").forEach(row => {
    const rowData = [];
    row.querySelectorAll("td").forEach(cell => {
      rowData.push(formatCsvField(cell.innerText));
    });
    csvRows.push(rowData.join(','));
  });

  // 3. Join all rows with a newline character
  const csvContent = csvRows.join('\n');

  // 4. Create a Blob and trigger the download
  downloadCsv(csvContent);
}

/**
 * Creates a blob from the CSV content and triggers a browser download.
 * @param {string} csvContent - The CSV data as a single string.
 */
function downloadCsv(csvContent) {
  // Create a blob
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  // Create a link to download the blob
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);

  // Set the filename for the download
  const date = new Date().toISOString().slice(0, 10);
  link.setAttribute("download", `attendance_logs_${date}.csv`);

  // Hide the link and add it to the body
  link.style.visibility = 'hidden';
  document.body.appendChild(link);

  // Simulate a click on the link to trigger the download
  link.click();

  // Clean up by removing the link
  document.body.removeChild(link);
}

/**
 * Placeholder function for the 'Refresh' button.
 */
function refreshLogs() {
  alert("Refresh functionality would be implemented here, e.g., by re-fetching data from a server.");
}


