document.getElementById("searchBtn").addEventListener("click", async () => {
  const query = document.getElementById("query").value.trim();
  if(!query) return;

  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "Searching...";

  try {
    const url = `https://clist.by/problems/?search=${encodeURIComponent(query)}`;
    
    //opening the new tab with that problem in search query
    chrome.tabs.create({ url: url });
    
  } catch (err) {
    resultsDiv.innerHTML = "Error: " + err.message;
  }
});
