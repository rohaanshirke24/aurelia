# Aurelia | The Operating System for the Solo Mind

**Aurelia** is an AI-driven operating system designed specifically for solo entrepreneurs ("solopreneurs"). It acts as a psychological anchor, strategic architect, and regulatory guide, helping founders navigate the complexities of building a business alone.

Unlike generic chatbots, Aurelia is context-aware, multimodal (Voice, Image, Text), and strictly operational—prioritizing execution over ideation.

---
 
## 🚀 Key Features

### 1. 🧠 Neural Link (Thinking Partner)
*   **Deep Context Awareness:** Remembers your business idea and current phase.
*   **Multimodal Input:** 
    *   **Text:** Strategy and operational advice.
    *   **Voice Mode (Live API):** Real-time, hands-free conversation with low-latency audio streaming.
    *   **Vision:** Analyze uploaded images (diagrams, screenshots) for feedback.
*   **Visualizers:** Real-time audio visualization for voice input/output.

### 2. 🗺️ Mission Map (Strategic Planner)
*   **30-60-90 Day Protocols:** Generates granular execution plans based on your specific business idea and stage.
*   **Interactive Checklists:** Track progress with objectives and sub-tasks.
*   **Exportable:** Download plans as Markdown for external use.

### 3. ⚖️ Compliance AI (Regulatory)
*   **Jargon Translator:** Upload documents or paste legal text to get a "Plain English" explanation.
*   **Risk Assessment:** AI assigns a risk level (Low/Medium/High) and generates an immediate action checklist.

### 4. ⚡ Additional Modules
*   **Prompt Engineering:** Optimizes raw user goals into high-fidelity AI prompts.
*   **Fundraising Protocol:** Strategic guidance on unit economics and investor signaling.
*   **Foundations:** Quick reference for legal structures, IP, and cash flow management.

---

## 🛠️ Tech Stack

*   **Frontend:** React (v18), TypeScript, Vite
*   **Styling:** Tailwind CSS (Custom "Void/Cyberpunk" Theme)
*   **AI Integration:** 
    *   `@google/genai` SDK
    *   Gemini 2.5 Flash (Live Audio)
    *   Gemini 3 Pro (Complex Reasoning)
    *   Gemini 3 Flash (Fast Tasks)
*   **Icons:** Lucide React
*   **Deployment:** Vercel / Netlify ready

---

## ⚡ Quick Start

### Prerequisites
*   Node.js (v18+)
*   A Google AI Studio API Key ([Get one here](https://aistudio.google.com/app/apikey))

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/aurelia-os.git
    cd aurelia-os
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the root directory:
    ```env
    API_KEY=your_google_gemini_api_key_here
    ```

4.  **Run Development Server:**
    ```bash
    npm run dev
    ```

---

## 🌐 Deployment

### Vercel / Netlify
1.  Push your code to a GitHub repository.
2.  Import the project into Vercel/Netlify.
3.  **Critical:** Add your `API_KEY` in the project settings under "Environment Variables".
4.  Deploy!

---

## 🛡️ Privacy & Security
Aurelia runs entirely client-side for the UI logic. Data is processed via the Google Gemini API.
*   **Local Storage:** Business plans and history are stored in your browser's `localStorage` for persistence without a backend database.
*   **API Keys:** Handled via server-side environment variables during build/runtime to prevent exposure.

---

## 📄 License
MIT License. Free to fork and build upon.
