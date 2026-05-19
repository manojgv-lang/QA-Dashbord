import { useState } from "react";

const API_URL =
  "https://script.google.com/macros/s/AKfycbx20-majQxyCLQaSjvkZ8sZ6za2c86SoKqXasoffs3eM9u38otubiHHkcLeJXcBAFfZIw/exec";

export default function App() {
  const [email, setEmail] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [agents, setAgents] = useState([]);
  const [agent, setAgent] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [report, setReport] = useState(null);
  const [status, setStatus] = useState("");

  async function apiCall(payload) {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
    });

    const text = await res.text();

    try {
      return JSON.parse(text);
    } catch (err) {
      console.log("API returned:", text);
      return {
        ok: false,
        error:
          "API returned HTML, not JSON. Check Apps Script deployment and Vercel latest deploy.",
      };
    }
  }

  async function login() {
    if (!email) {
      setStatus("Please enter email.");
      return;
    }

    setStatus("Verifying access...");

    const data = await apiCall({
      action: "login",
      email,
    });

    if (!data.ok) {
      setStatus(data.error);
      return;
    }

    setCurrentUser(data);
    setAgents(data.agents || []);
    setAgent((data.agents || [])[0] || "");
    setStatus("");
  }

  async function generateReport() {
    if (!from || !to) {
      setStatus("Please select From Date and To Date.");
      return;
    }

    setStatus("Generating report...");

    const data = await apiCall({
      action: "getReport",
      email: currentUser.email,
      agent,
      from,
      to,
    });

    if (!data.ok) {
      setStatus(data.error);
      return;
    }

    setReport(data);
    setStatus("Report generated successfully.");
  }

  async function sendReportEmail() {
    if (!report) {
      setStatus("Please generate report first.");
      return;
    }

    const agentEmail = prompt("Enter agent email ID:");

    if (!agentEmail) {
      setStatus("Agent email is required.");
      return;
    }

    const confirmSend = window.confirm(
      "Send QA report to " + agentEmail + "?"
    );

    if (!confirmSend) return;

    setStatus("Sending report email...");

    const data = await apiCall({
      action: "sendAgentReportEmail",
      email: currentUser.email,
      agentName: report.agent,
      agentEmail,
      period: report.period,
      htmlBody: buildReportHtml(report),
    });

    if (!data.ok) {
      setStatus(data.error);
      return;
    }

    setStatus("✅ " + data.message);
  }

  function formatText(text) {
    if (!text) return "-";
    return String(text).replace(/\n/g, "<br>").replace(/\*/g, "");
  }

  function buildReportHtml(data) {
    const rows = data.calls
      .map(
        (call, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${data.agent}</td>
          <td>${call.slNo || "-"}</td>
          <td>${
            call.recordingLink
              ? `<a href="${call.recordingLink}">Recording Link</a>`
              : "-"
          }</td>
          <td>${call.callDate || "-"}</td>
          <td>${call.queryType || "-"}</td>
          <td>${call.finalScore || "-"}</td>
          <td>${call.score || "-"}%</td>
          <td>${formatText(call.feedback)}</td>
        </tr>`
      )
      .join("");

    return `
      <div style="font-family:Arial,sans-serif;color:#111;font-size:13px;">
        <p>Hi ${data.agent},</p>

        <p>Please find the Audit Feedback for the calls calibrated in the mentioned week.</p>

        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <tr>
            <th style="border:1px solid #000;padding:8px;background:#d9ead3;">Audit Week</th>
            <th style="border:1px solid #000;padding:8px;background:#d9ead3;">Agent Name</th>
            <th style="border:1px solid #000;padding:8px;background:#d9ead3;">Total Calls Audited</th>
            <th style="border:1px solid #000;padding:8px;background:#d9ead3;">Average Audit Score</th>
          </tr>
          <tr>
            <td style="border:1px solid #000;padding:8px;">${data.period}</td>
            <td style="border:1px solid #000;padding:8px;">${data.agent}</td>
            <td style="border:1px solid #000;padding:8px;">${data.totalAudits}</td>
            <td style="border:1px solid #000;padding:8px;">${data.averageScore}%</td>
          </tr>
        </table>

        <p>Note: Each call and effort is meant to improve the future results in further conversations.</p>

        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <tr>
            <th style="border:1px solid #000;padding:8px;background:#d9ead3;">SL No</th>
            <th style="border:1px solid #000;padding:8px;background:#d9ead3;">Agent Name</th>
            <th style="border:1px solid #000;padding:8px;background:#d9ead3;">Audit SL No</th>
            <th style="border:1px solid #000;padding:8px;background:#d9ead3;">Call Recording</th>
            <th style="border:1px solid #000;padding:8px;background:#d9ead3;">Call Date</th>
            <th style="border:1px solid #000;padding:8px;background:#d9ead3;">Issue Type</th>
            <th style="border:1px solid #000;padding:8px;background:#d9ead3;">Final Score</th>
            <th style="border:1px solid #000;padding:8px;background:#d9ead3;">Audit Score</th>
            <th style="border:1px solid #000;padding:8px;background:#d9ead3;">Feedback / Observation</th>
          </tr>
          ${rows}
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
    const issueCalls = data.calls.filter((call) => Number(call.score) < 90);

    let rows = "";

    if (issueCalls.length === 0) {
      rows = `
        <tr>
          <td style="border:1px solid #000;padding:8px;">${data.agent}</td>
          <td style="border:1px solid #000;padding:8px;">Overall Performance</td>
          <td style="border:1px solid #000;padding:8px;">Good performance maintained for the selected audit period.</td>
        </tr>`;
    } else {
      rows = issueCalls
        .map(
          (call) => `
          <tr>
            <td style="border:1px solid #000;padding:8px;">${data.agent}</td>
            <td style="border:1px solid #000;padding:8px;">${call.queryType || "Improvement Area"}</td>
            <td style="border:1px solid #000;padding:8px;">${formatText(call.feedback)}</td>
          </tr>`
        )
        .join("");
    }

    return `
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:14px;">
        <tr>
          <td colspan="3" style="border:1px solid #000;padding:8px;background:#ffff00;font-weight:bold;text-align:center;">Areas of Improvement</td>
        </tr>
        <tr>
          <th style="border:1px solid #000;padding:8px;background:#d9ead3;">Agent Name</th>
          <th style="border:1px solid #000;padding:8px;background:#d9ead3;">Parameter</th>
          <th style="border:1px solid #000;padding:8px;background:#d9ead3;">Improvement Required</th>
        </tr>
        ${rows}
      </table>`;
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1>QA Dashboard</h1>

        {!currentUser ? (
          <>
            <label>Email</label>
            <input
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
            <button style={styles.primaryBtn} onClick={login}>
              Login
            </button>
          </>
        ) : (
          <>
            <p>
              <b>Email:</b> {currentUser.email}
            </p>
            <p>
              <b>Role:</b> {currentUser.role}
            </p>

            <label>Agent</label>
            <select
              style={styles.input}
              value={agent}
              onChange={(e) => setAgent(e.target.value)}
            >
              {agents.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>

            <label>From Date</label>
            <input
              style={styles.input}
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />

            <label>To Date</label>
            <input
              style={styles.input}
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />

            <button style={styles.primaryBtn} onClick={generateReport}>
              Generate Report
            </button>

            <button style={styles.greenBtn} onClick={sendReportEmail}>
              Send Report
            </button>
          </>
        )}

        <p style={styles.status}>{status}</p>
      </div>

      {report && (
        <div style={styles.card}>
          <h2>Generated Report Preview</h2>
          <div
            style={styles.reportBox}
            dangerouslySetInnerHTML={{ __html: buildReportHtml(report) }}
          />
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    fontFamily: "Arial, sans-serif",
    background: "#f5f7fb",
    minHeight: "100vh",
    padding: "24px",
  },
  card: {
    background: "#fff",
    padding: "22px",
    borderRadius: "14px",
    boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
    marginBottom: "20px",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginTop: "6px",
    marginBottom: "12px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    boxSizing: "border-box",
  },
  primaryBtn: {
    background: "#1976d2",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
    marginRight: "8px",
  },
  greenBtn: {
    background: "#0f9d58",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
  },
  status: {
    fontWeight: "700",
    color: "#0b57d0",
  },
  reportBox: {
    background: "white",
    padding: "15px",
    border: "1px solid #ddd",
    overflowX: "auto",
  },
};
