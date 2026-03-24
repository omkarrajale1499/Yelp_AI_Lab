# 🍽️ Yelp AI Platform

A modern, full-stack restaurant discovery and review platform enhanced with a context-aware Artificial Intelligence assistant. This project modernizes the traditional review-site experience by integrating a conversational AI that provides hyper-personalized dining recommendations based on user profiles.

## ✨ Key Features

* **Conversational AI Assistant:** Powered by LangChain and local LLMs (Llama 3.1), the chatbot cross-references natural language queries with a user's saved preferences (dietary restrictions, budget, vibe) and the local database to generate highly accurate recommendations.
* **Robust User Profiles:** Users can manage their personal details, track their activity history, save favorite restaurants, and dynamically update their "AI Brain" preferences.
* **Intelligent Image Handling:** Features a full-stack local file upload system for profile pictures and restaurant galleries, complete with seamless Unsplash URL fallbacks for missing data.
* **Dynamic Business Logic:** Real-time operating hours calculation, interactive rating systems (with SVG-precise half-stars), and dynamic search filtering.
* **Role-Based Access Control:** Distinct experiences for standard Users and Business Owners, including a secure business-claiming pipeline.

## 🛠️ Tech Stack

**Frontend:**
* React.js
* Tailwind CSS (Styling & Responsive UI)
* React Router (Navigation)
* Axios (API Communication)

**Backend:**
* Python 3 & FastAPI (High-performance REST API)
* SQLAlchemy (ORM)
* Pydantic (Data validation and serialization)
* JWT (JSON Web Tokens for secure authentication)

**Database & AI:**
* MySQL (Relational database management)
* LangChain (AI workflow orchestration)

---

## 🚀 Local Setup & Installation

Follow these steps to run the platform locally on your machine.

### 1. Prerequisites
* Node.js and npm installed
* Python 3.9+ installed
* MySQL Server running locally

### 2. Database Configuration
1. Open MySQL Workbench.
2. Create a new database for the project:
   ```sql
   CREATE DATABASE yelp_ai_db;