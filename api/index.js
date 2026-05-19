<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>QA Dashboard</title>

  <style>
    body {
      font-family: Arial, sans-serif;
      background: #f5f7fb;
      margin: 0;
      padding: 24px;
      color: #111;
    }

    .card {
      background: #fff;
      padding: 22px;
      border-radius: 14px;
      box-shadow: 0 6px 18px rgba(0,0,0,0.08);
      margin-bottom: 20px;
    }

    h2, h3 {
      margin-top: 0;
    }

    label {
      font-weight: 700;
      display: block;
      margin-top: 12px;
    }

    input, select {
      width: 100%;
      padding: 10px;
      margin-top: 6px;
      border: 1px solid #ccc;
      border-radius: 8px;
      box-sizing: border-box;
    }

    button {
      padding: 10px 16px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 700;
      margin-top: 16px;
      margin-right: 8px;
    }

    .primary {
      background: #1976d2;
      color: white;
    }

    .success {
      background: #0f9d58;
      color: white;
    }

    .status {
      margin-top: 12px;
      font-weight: 700;
    }

    .hidden {
      display: none;
    }

    .report-box {
      background: white;
      padding: 15px;
      border: 1px solid #ddd;
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-top: 14px;
      background: white;
    }

    th, td {
      border: 1px solid #000;
      padding: 8px;
      vertical-align: top;
      text-align: left;
    }

    th {
      background: #d9ead3;
      font-weight: bold;
    }

    .yellow {
      background: #ffff00;
      font-weight: bold;
      text-align: center;
    }
  </style>
</head>

<body>

<div class="card" id="loginBox">
  <h2>QA Dashboard</h2>

  <label>Email</label>
  <input type="email" id="loginEmail" placeholder="Enter your email" />

  <button class="primary" onclick="login()">Login</button>

  <div id="loginStatus" class="status"></div>
</div>

<div id="dashboardBox" class="hidden">

  <div class="card">
    <h2>Agent QA Report</h2>

    <label>Agent</label>
    <select id="agentSelect"></select>

    <label>From Date</label>
    <input type="date" id="fromDate" />

    <label>To Date</label>
    <input type="date" id="toDate" />

    <button class="primary" onclick="generateReport()">Generate Report</button>
    <button class="success" onclick="sendReportEmail()">Send Report</button>

    <div id="reportStatus" class="status"></div>
    <div id="emailStatus" class="status"></div>
  </div>

  <div class="card">
    <h3>Generated Report Preview</h3>
    <div id="reportArea" class="report-box">
      Report will appear here.
    </div>
  </div>

</div>

<script>
const API_URL = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";

let currentUser = null;
let currentReport = null;

async function apiCall(payload) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      }
    });

    const text = await res.text();

    try {
      return JSON.parse(text);
    } catch (err) {
      console.error("Non JSON response:", text);
      return {
        ok: false,
        error: "Wrong Apps Script URL or deployment access issue. Use Web App URL ending with /exec and set access to Anyone."
      };
    }

  } catch (err) {
    return {
      ok: false,
      error: err.message
    };
  }
}

async function login() {
  const email = document.getElementById("loginEmail").value.trim();
  const status = document.getElementById("loginStatus");

  if (!email) {
    status.style.color = "red";
    status.innerHTML = "Please enter email.";
    return;
  }

  status.style.color = "#111";
  status.innerHTML = "Verifying access...";

  const data = await apiCall({
    action: "login",
    email: email
  });

  if (!data.ok) {
    status.style.color = "red";
    status.innerHTML = data.error;
    return;
  }

  currentUser = data;

  document.getElementById("loginBox").classList.add("hidden");
  document.getElementById("dashboardBox").classList.remove("hidden");

  loadAgents(data.agents);

  status.innerHTML = "";
}

function loadAgents(agents) {
  const select = document.getElementById("agentSelect");
  select.innerHTML = "";

  agents.forEach(agent => {
    const option = document.createElement("option");
    option.value = agent;
    option.textContent = agent;
    select.appendChild(option);
  });
}

async function generateReport() {
  const agent = document.getElementById("agentSelect").value;
  const from = document.getElementById("fromDate").value;
  const to = document.getElementById("toDate").value;
  const status = document.getElementById("reportStatus");

  if (!from || !to) {
    status.style.color = "red";
    status.innerHTML = "Please select From Date and To Date.";
    return;
  }

  status.style.color = "#111";
  status.innerHTML = "Generating report...";

  const data = await apiCall({
    action: "getReport",
    email: currentUser.email,
    agent: agent,
    from: from,
    to: to
  });

  if (!data.ok) {
    status.style.color = "red";
    status.innerHTML = data.error;
    return;
  }

  currentReport = data;

  document.getElementById("reportArea").innerHTML = buildReportHtml(data);

  status.style.color = "green";
  status.innerHTML = "Report generated successfully.";
}

function buildReportHtml(data) {
  let callRows = "";

  data.calls.forEach((call, index) => {
    callRows += `
      <tr>
        <td>${index + 1}</td>
        <td>${data.agent}</td>
        <td>${call.slNo || "-"}</td>
        <td>${call.recordingLink ? `<a href="${call.recordingLink}" target="_blank">Recording Link</a>` : "-"}</td>
        <td>${call.callDate || "-"}</td>
        <td>${call.queryType || "-"}</td>
        <td>${call.finalScore || "-"}</td>
        <td>${call.score || "-"}%</td>
        <td>${formatText(call.feedback)}</td>
      </tr>
    `;
  });

  return `
    <div style="font-family:Arial,sans-serif;color:#111;font-size:13px;">
      <p>Hi ${data.agent},</p>

      <p>Please find the Audit Feedback for the calls calibrated in the mentioned week.</p>

      <table>
        <tr>
          <th>Audit Week</th>
          <th>Agent Name</th>
          <th>Total Calls Audited</th>
          <th>Average Audit Score</th>
          <th>Period</th>
        </tr>
        <tr>
          <td>${data.period}</td>
          <td>${data.agent}</td>
          <td>${data.totalAudits}</td>
          <td>${data.averageScore}%</td>
          <td>${data.period}</td>
        </tr>
      </table>

      <p>Note: Each call and effort is meant to improve the future results in further conversations.</p>

      <table>
        <tr>
          <th>SL No</th>
          <th>Agent Name</th>
          <th>Audit SL No</th>
          <th>Call Recording</th>
          <th>Call Date</th>
          <th>Issue Type</th>
          <th>Final Score</th>
          <th>Audit Score</th>
          <th>Feedback / Observation</th>
        </tr>
        ${callRows}
      </table>

      ${buildImprovementTable(data)}

      <p style="margin-top:20px;">
        Best regards,<br>
        QA Audit Team
      </p>
    </div>
  `;
}

function buildImprovementTable(data) {
  const issueCalls = data.calls.filter(call => Number(call.score) < 90);

  let rows = "";

  if (issueCalls.length === 0) {
    rows = `
      <tr>
        <td>${data.agent}</td>
        <td>Overall Performance</td>
        <td>Good performance maintained for the selected audit period.</td>
      </tr>
    `;
  } else {
    issueCalls.forEach(call => {
      rows += `
        <tr>
          <td>${data.agent}</td>
          <td>${call.queryType || "Improvement Area"}</td>
          <td>${formatText(call.feedback)}</td>
        </tr>
      `;
    });
  }

  return `
    <table>
      <tr>
        <td colspan="3" class="yellow">Areas of Improvement</td>
      </tr>
      <tr>
        <th>Agent Name</th>
        <th>Parameter</th>
        <th>Improvement Required</th>
      </tr>
      ${rows}
    </table>
  `;
}

function formatText(text) {
  if (!text) return "-";

  return text
    .toString()
    .replace(/\n/g, "<br>")
    .replace(/\*/g, "");
}

async function sendReportEmail() {
  const status = document.getElementById("emailStatus");

  if (!currentReport) {
    status.style.color = "red";
    status.innerHTML = "Please generate report first.";
    return;
  }

  const agentEmail = prompt("Enter agent email ID:");

  if (!agentEmail) {
    status.style.color = "red";
    status.innerHTML = "Agent email is required.";
    return;
  }

  const confirmSend = confirm("Send QA report to " + agentEmail + "?");

  if (!confirmSend) return;

  status.style.color = "#111";
  status.innerHTML = "Sending report email...";

  const data = await apiCall({
    action: "sendAgentReportEmail",
    email: currentUser.email,
    agentName: currentReport.agent,
    agentEmail: agentEmail,
    period: currentReport.period,
    htmlBody: buildEmailHtml(currentReport)
  });

  if (!data.ok) {
    status.style.color = "red";
    status.innerHTML = data.error;
    return;
  }

  status.style.color = "green";
  status.innerHTML = "✅ " + data.message;
}

function buildEmailHtml(data) {
  return `
    <div style="font-family:Arial,sans-serif;color:#111;font-size:13px;line-height:1.5;">
      ${buildReportHtml(data)}
    </div>
  `;
}
</script>

</body>
</html>
