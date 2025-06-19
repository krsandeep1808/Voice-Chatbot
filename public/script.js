const micButton = document.getElementById("micButton");
const chatBox = document.getElementById("chatBox");

// Initialize Speech Recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'en-US';
recognition.interimResults = false;

// Error handling for speech recognition
recognition.onerror = (event) => {
  console.error("Speech recognition error:", event.error);
  appendMessage("system", `Error: ${event.error}`);
};

// Start recording
micButton.addEventListener("click", () => {
  try {
    recognition.start();
    appendMessage("system", "Listening...");
  } catch (error) {
    console.error("Mic error:", error);
    appendMessage("error", "Microphone access denied. Please refresh and allow permissions.");
  }
});

// Process speech input
recognition.onresult = async (event) => {
  const userSpeech = event.results[0][0].transcript;
  appendMessage("user", userSpeech);
  
  try {
    const apiResponse = await callChatAPI(userSpeech);
    if (apiResponse.success) {
      appendMessage("bot", apiResponse.reply);
      speak(apiResponse.reply);
    } else {
      throw new Error(apiResponse.error);
    }
  } catch (error) {
    console.error("API Error:", error);
    appendMessage("error", error.message);
  }
};

// Improved API call function
async function callChatAPI(message) {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    // Check for network errors
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }

    // Parse JSON safely
    const data = await response.json();
    
    if (!data.reply) {
      throw new Error("Empty response from server");
    }

    return { success: true, reply: data.reply };
    
  } catch (error) {
    console.error("API call failed:", error);
    return { 
      success: false, 
      error: error.message || "Failed to get response"
    };
  }
}

// Helper functions
function appendMessage(sender, text) {
  const msg = document.createElement("p");
  msg.className = sender;
  msg.innerHTML = `<strong>${sender}:</strong> ${text}`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  window.speechSynthesis.speak(utterance);
}