document.addEventListener("DOMContentLoaded", () => {
  initUI();
  detectProblemAndAddButton();
});

function initUI() {
  const searchBtn = document.getElementById("search-btn");
  const queryInput = document.getElementById("query-input");

  searchBtn.addEventListener("click", manualSearch);
  
  queryInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      manualSearch();
    }
  });
}

function manualSearch() {
  const query = document.getElementById("query-input").value.trim();
  if (query) {
    openClistSearch(query);
  }
}

function openClistSearch(query) {
  const url = `https://clist.by/problems/?search=${encodeURIComponent(query)}`;
  chrome.tabs.create({ url });
}

/**
 * Sets a simple text message in the results area.
 * @param {string} message The text to display.
 */
function setResultsMessage(message) {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = `<small class="muted-text">${message}</small>`;
}

/**
 * @param {string} query The search query for the problem.
 * @param {string} titleAttr The hover title for the button.
 */
function addAutoButton(query, titleAttr = "") {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = ""; // Clear previous content

  const wrapper = document.createElement("div");
  wrapper.className = "detected-result";

  const btn = document.createElement("button");
  btn.className = "btn btn-success"; 
  btn.textContent = "Go";
  btn.title = `${titleAttr}\nQuery: ${query}`;
  btn.addEventListener("click", () => openClistSearch(query));

  const info = document.createElement("span");
  info.className = "problem-title";
  info.textContent = query;
  info.title = query;

  wrapper.appendChild(btn);
  wrapper.appendChild(info);
  resultsDiv.appendChild(wrapper);
}


/**
 * Detects if the current tab is a leetcode or codeforces problem page.
 */
async function detectProblemAndAddButton() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if(!tab?.url) return;

    const u = new URL(tab.url);

    // leetCode Detection
    if (u.hostname.includes("leetcode.com") && u.pathname.includes("/problems/")) {
      const parts = u.pathname.split("/").filter(Boolean);
      const slug = parts[parts.indexOf("problems") + 1] || "";
      if (slug) {
        const query = slug.replace(/[-_]+/g, " ").trim();
        addAutoButton(query, "Detected LeetCode Problem");
        return;
      }
    }

    //codeforces Detection
    const cfPatterns = [
      /\/contest\/(\d+)\/problem\/([A-Z\d]+)/,
      /\/problemset\/problem\/(\d+)\/([A-Z\d]+)/,
      /\/problem\/(\d+)\/([A-Z\d]+)/
    ];
    const cfMatch = cfPatterns.map(p => u.pathname.match(p)).find(m => m);

    if (u.hostname.includes("codeforces.com") && cfMatch) {
      const [_, contest, letter] = cfMatch;
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => document.querySelector('.problem-statement .title')?.innerText.trim(),
      });
      
      const titleText = results?.[0]?.result;
      if (titleText) {
        // Clean up common prefixes like "A. "
        const cleanedTitle = titleText.replace(/^[A-Z\d]+\.\s*/, "").trim();
        addAutoButton(cleanedTitle, "Detected Codeforces Problem");
      } else {
        // Fallback to using contest ID and problem letter
        const fallbackQuery = `${contest}${letter}`;
        addAutoButton(fallbackQuery, "Detected Codeforces Problem (fallback)");
      }
      return;
    }

    // If no problem is detected on a supported site
    setResultsMessage("No problem detected on this page.");

  } catch (err) {
    console.error("Error detecting problem:", err);
    setResultsMessage(`Error: ${err.message}`);
  }
}