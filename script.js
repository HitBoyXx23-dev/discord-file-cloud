// --- Configuration ---
const WEBHOOK_URL = "https://discord.com/api/webhooks/1409169385003810876/nKYLJX4_fUEmadxRituFll6V40Z1CsoGrJnUznRyBj3BxqjeWcwjKcXaxwQIsOP3VJCS";

// --- DOM ---
const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const resultsGrid = document.getElementById("resultsGrid");
const dropzone = document.getElementById("dropzone");

// --- Helpers ---
function createPreviewCard(file) {
  const card = document.createElement("div");
  card.className = "file-card";

  // Preview
  let preview;
  if (file.type.startsWith("image/")) {
    preview = document.createElement("img");
    preview.src = URL.createObjectURL(file);
    preview.className = "file-preview";
  } else if (file.type.startsWith("video/")) {
    preview = document.createElement("video");
    preview.src = URL.createObjectURL(file);
    preview.controls = true;
    preview.className = "file-preview";
  } else if (file.type === "application/pdf") {
    preview = document.createElement("embed");
    preview.src = URL.createObjectURL(file);
    preview.type = "application/pdf";
    preview.className = "file-preview";
  } else {
    preview = document.createElement("div");
    preview.textContent = "📄";
    preview.style.fontSize = "40px";
  }

  const nameEl = document.createElement("div");
  nameEl.textContent = file.name;
  nameEl.className = "file-name";

  const status = document.createElement("div");
  status.className = "status";
  status.textContent = "Ready to upload";

  const urlInput = document.createElement("input");
  urlInput.type = "text";
  urlInput.placeholder = "URL will appear here";
  urlInput.className = "url-input";
  urlInput.readOnly = true;

  const copyBtn = document.createElement("button");
  copyBtn.className = "copy";
  copyBtn.textContent = "Copy URL";
  copyBtn.addEventListener("click", async () => {
    const url = urlInput.value.trim();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      copyBtn.textContent = "Copied!";
      setTimeout(() => (copyBtn.textContent = "Copy URL"), 1000);
    } catch {
      copyBtn.textContent = "Err";
      setTimeout(() => (copyBtn.textContent = "Copy URL"), 1000);
    }
  });

  card.appendChild(preview);
  card.appendChild(nameEl);
  card.appendChild(status);
  card.appendChild(urlInput);
  card.appendChild(copyBtn);

  resultsGrid.prepend(card);
  return { status, urlInput };
}

// --- Upload Function ---
async function postFiles(files) {
  for (const file of files) {
    const cardObj = createPreviewCard(file);
    cardObj.status.textContent = `Uploading ${file.name}…`;

    const form = new FormData();
    form.append("payload_json", JSON.stringify({}));
    form.append("files[0]", file, file.name);

    try {
      const res = await fetch(WEBHOOK_URL, { method: "POST", body: form });
      if (!res.ok) {
        cardObj.status.textContent = `Upload failed (${res.status})`;
        continue;
      }

      // Parse JSON response to get the CDN URL
      const data = await res.json().catch(() => null);
      const fileUrl = data?.attachments?.[0]?.url;

      if (fileUrl) {
        cardObj.urlInput.value = fileUrl;
        cardObj.status.textContent = "Uploaded! URL ready to copy.";
      } else {
        cardObj.status.textContent = "Uploaded! (No URL returned)";
      }
    } catch (err) {
      cardObj.status.textContent = "Network error";
    }
  }
  fileInput.value = "";
}

// --- Events ---
uploadBtn.addEventListener("click", () => {
  if (!fileInput.files.length) return alert("Choose at least one file.");
  postFiles(fileInput.files);
});

["dragenter","dragover"].forEach(evt =>
  dropzone.addEventListener(evt,e=>{
    e.preventDefault(); e.stopPropagation(); dropzone.classList.add("dragging");
  })
);
["dragleave","drop"].forEach(evt =>
  dropzone.addEventListener(evt,e=>{
    e.preventDefault(); e.stopPropagation(); dropzone.classList.remove("dragging");
  })
);
dropzone.addEventListener("drop", e => {
  if (!e.dataTransfer?.files?.length) return;
  fileInput.files = e.dataTransfer.files;
});
