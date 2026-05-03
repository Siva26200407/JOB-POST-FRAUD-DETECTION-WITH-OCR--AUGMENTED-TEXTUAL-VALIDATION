# Project Setup Instructions

Since Python and Node.js are currently not installed on your system, please follow these steps to prepare your environment for this deep learning project.

## 1. Install Required Software
1. **Python**: Download and install Python 3.10+ from [python.org](https://www.python.org/downloads/windows/). **Make sure to check the box "Add Python to PATH" during installation.**
2. **Node.js**: Download and install Node.js (LTS version) from [nodejs.org](https://nodejs.org/). This is required for the React frontend.

## 2. Google Cloud Console Credentials (OAuth 2.0)
To enable Google Login on the frontend, you need to generate OAuth credentials. Follow these steps:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click on **Select a project** (top left) -> **New Project**. Name it `FakeJobDetection` and click **Create**.
3. In the left sidebar, go to **APIs & Services** -> **OAuth consent screen**.
4. Select **External** and click **Create**.
5. Fill in the required fields (App name: `FakeJobDetection`, User support email, Developer contact info) and click **Save and Continue** until the end.
6. Go to **Credentials** (left sidebar).
7. Click **+ CREATE CREDENTIALS** -> **OAuth client ID**.
8. Application type: **Web application**.
9. Name: `React Frontend`.
10. Under **Authorized JavaScript origins**, click **ADD URI** and enter:
    `http://localhost:5173` (This is the default Vite dev server URL).
11. Under **Authorized redirect URIs**, enter:
    `http://localhost:5173`
12. Click **Create**.
13. You will get a popup with your **Client ID** and **Client Secret**.
14. Copy these into a `.env` file in your frontend and backend directories (I will create a `.env.example` file for you).

## 3. Web Search API (SerpAPI)
I have chosen **SerpAPI** as the best, most reliable API for fetching real-world Google Search and Job board results (LinkedIn, Indeed) without getting blocked.
1. Go to [serpapi.com](https://serpapi.com/).
2. Create a free account.
3. Go to the dashboard and copy your **API Key**.
4. Add this to your `.env` file as well.
