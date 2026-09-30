# Singularity Avatar AI Backend

This is the Python AI Backend Microservice for the **Singularity 3D Avatar Game**.

## 🌟 Why Python for the Backend?

1. **Native AI Ecosystem**: Python is the premier language for generative AI, LLMs, and agentic systems (Google GenAI / Gemini, LangChain, LlamaIndex, PyTorch, Hugging Face).
2. **Clean Separation of Concerns**:
   - **Frontend (Next.js / React 19 / Three.js)**: Responsible for 60 FPS WebGL rendering, 3D character rigging, audio synthesis, and interactive UI.
   - **Backend (Python / FastAPI)**: Handles AI Lore generation, real-time battle referee commentary, tactical NPC decision trees, and LLM integrations.
3. **Standalone Fallbacks**: The Next.js frontend has built-in local procedural fallbacks, so the game remains 100% playable even if the Python AI service is offline.

---

## 🚀 Quickstart

### 1. Install Dependencies
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Start the Server
```bash
uvicorn main:app --reload --port 8000
```

The interactive OpenAPI / Swagger documentation will be available at:
👉 **http://localhost:8000/docs**

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check & service info |
| `POST` | `/api/ai/lore` | Generates rich RPG backstories, titles, and battle cries based on species/class/gear |
| `POST` | `/api/ai/commentary` | Generates real-time esports referee commentary during 3D combat |
| `POST` | `/api/ai/tactics` | AI tactical engine that computes the optimal combat move |

---

## 🧠 Connecting to Gemini or OpenAI

To plug in a live LLM (such as Google Gemini 1.5 Flash), install the SDK:
```bash
pip install google-genai
```
And add your API key in `backend/main.py`:
```python
import os
from google import genai

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=f"Generate an epic battle cry for a {species} {role} named {name}"
)
```
