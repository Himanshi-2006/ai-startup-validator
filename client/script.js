async function submitIdea() {

  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const loading = document.getElementById("loading");
  const resultDiv = document.getElementById("result");

  if (!title || !description) {
    alert("Please fill all fields");
    return;
  }

  loading.classList.remove("hidden");
  resultDiv.innerHTML = "";

  try {

    const res = await fetch("http://localhost:5000/ideas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ title, description })
    });

    const data = await res.json();

    loading.classList.add("hidden");

    if (data.error) {
      resultDiv.innerHTML = `<p style="color:red;">${data.error}</p>`;
      return;
    }

    // Format AI report nicely
    const report = data.report;

    resultDiv.innerHTML = `
      <div class="card">
        <h2>📊 AI Validation Report</h2>
        <p><strong>Problem:</strong> ${report.problem}</p>
        <p><strong>Customer:</strong> ${report.customer}</p>
        <p><strong>Market:</strong> ${report.market}</p>
        <p><strong>Competitors:</strong> ${report.competitor}</p>
        <p><strong>Tech Stack:</strong> ${report.tech_stack}</p>
        <p><strong>Risk Level:</strong> ${report.risk_level}</p>
        <p><strong>Profitability Score:</strong> ${report.profitability_score}/100</p>
        <p><strong>Justification:</strong> ${report.justification}</p>
      </div>
    `;

  } catch (error) {
    loading.classList.add("hidden");
    resultDiv.innerHTML = `<p style="color:red;">Server error</p>`;
  }
}