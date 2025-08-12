// aqi-history.js
(function () {
  const API = (typeof window.API_BASE_URL !== "undefined" && window.API_BASE_URL) 
    ? window.API_BASE_URL.replace(/\/$/, "") 
    : (location.origin + "/api");

  let aqiDailyHistoryChart = null;
  let HIST_META = null;

  async function getMeta() {
    const r = await fetch(`${API}/aqi_history_meta`);
    if (!r.ok) throw new Error(`meta HTTP ${r.status}`);
    return r.json();
  }

  async function getMonthData(year, month) {
    const r = await fetch(`${API}/aqi_history_daily?year=${year}&month=${month}`);
    if (!r.ok) throw new Error(`daily HTTP ${r.status}`);
    return r.json();
  }

  function setSubtitle(text) {
    const el = document.getElementById("aqiHistorySubtitle");
    if (el) el.textContent = text;
  }

  async function renderAqiDailyHistoryChart(year, month) {
    const json = await getMonthData(year, month);

    const canvas = document.getElementById("aqiDailyHistoryChart");
    if (!canvas) return;

    // title/subtitle
    setSubtitle(json.month_year || `${year}-${String(month).padStart(2,"0")}`);

    if (aqiDailyHistoryChart) {
      aqiDailyHistoryChart.destroy();
      aqiDailyHistoryChart = null;
    }

    const ctx = canvas.getContext("2d");
    aqiDailyHistoryChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: json.labels,
        datasets: [{
          label: "Daily Max AQI (Historical)",
          data: json.data,
          borderWidth: 2,
          pointRadius: 2,
          tension: 0.25,
          spanGaps: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true },
          tooltip: {
            callbacks: {
              label: (ctx) => `AQI: ${ctx.raw == null ? "—" : ctx.raw}`
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, grid: { display: false } }
        }
      }
    });
  }

  // simple “Date range” popover wiring
  function wireDateRange() {
    const btn = document.getElementById("aqiRangeBtn");
    const pop = document.getElementById("aqiRangePopover");
    const ySel = document.getElementById("aqiRangeYear");
    const mSel = document.getElementById("aqiRangeMonth");
    const apply = document.getElementById("aqiRangeApply");
    if (!btn || !pop || !ySel || !mSel || !apply) return;

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      pop.classList.toggle("hidden");
    });
    document.addEventListener("click", (e) => {
      if (!pop.contains(e.target) && e.target !== btn) pop.classList.add("hidden");
    });

    // populate year options from meta
    ySel.innerHTML = "";
    for (let y = HIST_META.min_year; y <= HIST_META.max_year; y++) {
      const opt = document.createElement("option");
      opt.value = y;
      opt.textContent = y;
      if (y === HIST_META.latest_year) opt.selected = true;
      ySel.appendChild(opt);
    }
    mSel.value = HIST_META.latest_month;

    apply.addEventListener("click", async () => {
      const y = parseInt(ySel.value, 10);
      const m = parseInt(mSel.value, 10);
      pop.classList.add("hidden");
      try {
        await renderAqiDailyHistoryChart(y, m);
      } catch (err) {
        console.error(err);
        setSubtitle("Failed to load historical data");
      }
    });
  }

  // boot
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      HIST_META = await getMeta();                // <- default to latest month in CSV
      wireDateRange();
      await renderAqiDailyHistoryChart(HIST_META.latest_year, HIST_META.latest_month);
    } catch (err) {
      console.error("History init error:", err);
      setSubtitle("Failed to load historical data");
    }
  });
})();
