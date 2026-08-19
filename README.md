# 🏛️ Kerala Government Orders AI System

A multilingual AI-powered web application for analyzing **Kerala Government Orders (G.O.)**. This project combines **Named Entity Recognition (NER)** and **Large Language Models (LLMs)** to extract key metadata, summarize documents, and answer questions about Government Orders.

The application supports **both English and Malayalam Government Orders** and provides **three independent modes** of analysis:

- 🇬🇧 English NER
- 🇮🇳 Malayalam NER
- 🤖 AI Assistant

---

## 📖 Table of Contents

- [Project Overview](#-project-overview)
- [Features](#-features)
- [System Workflow](#-system-workflow)
- [English NER](#-english-ner)
- [Malayalam NER](#-malayalam-ner)
- [AI Assistant](#-ai-assistant)
- [Web Application](#-web-application)
- [Screenshots](#-screenshots)
- [Repository Structure](#-repository-structure)
- [Technologies Used](#-technologies-used)
- [Installation](#-installation)
- [Usage](#-usage)
- [Future Work](#-future-work)
- [Author](#-author)

---

# 📌 Project Overview

Kerala Government Orders contain valuable administrative information but are often lengthy and difficult to navigate.

This project simplifies document analysis by allowing users to upload a Government Order and choose one of three processing modes:

### 🇬🇧 English NER

Extracts

- Department Name
- Government Order Number
- Date

using a fine-tuned **XLM-RoBERTa** model.

---

### 🇮🇳 Malayalam NER

Performs the same metadata extraction for **Malayalam Government Orders** using a separate XLM-RoBERTa model trained specifically for Malayalam documents.

---

### 🤖 AI Assistant

Built using **LangChain** and **LangGraph**, the AI Assistant understands the complete document and can:

- Summarize Government Orders
- Answer user questions
- Extract metadata
- Explain document contents in natural language

---

# ✨ Features

- 🌐 Multilingual Support
- 🇬🇧 English NER
- 🇮🇳 Malayalam NER
- 🤖 AI Assistant
- 📝 Automatic Metadata Extraction
- 📄 Document Summarization
- 💬 Question Answering
- 🌍 Interactive Web Interface
- ⚡ LangChain + LangGraph Integration
- 🧠 XLM-RoBERTa based NER
- 📊 Weak Supervision Dataset Generation
- 📈 Model Evaluation using Precision, Recall & F1 Score

---

# 🏗️ System Workflow

```text
                  Upload Government Order
                           │
                           ▼
                Choose Processing Mode
                           │
     ┌─────────────────────┼──────────────────────┐
     │                     │                      │
     ▼                     ▼                      ▼
 English NER        Malayalam NER         AI Assistant
     │                     │                      │
     ▼                     ▼                      ▼
Extract Metadata    Extract Metadata     Summary & Q/A
     │                     │                      │
     └─────────────────────┼──────────────────────┘
                           ▼
                    Display Results
```

---

# 🇬🇧 English NER

The English NER module uses a fine-tuned **XLM-RoBERTa** model trained on Kerala Government Orders.

### Pipeline

- Weak Supervision Dataset Generation
- Automatic Entity Labeling
- BIO Tag Creation
- Tokenization using XLM-RoBERTa
- Fine-tuning
- Metadata Extraction

### Extracted Entities

| Entity | Description |
|---------|-------------|
| DEPARTMENT | Issuing Department |
| GO_NUMBER | Government Order Number |
| DATE | Government Order Date |

### Example

#### Input

```text
FINANCE (PENSION-A) DEPARTMENT

G.O.(Ms) No.353/2016/Fin.

Dated, Thiruvananthapuram, 01.09.2016
```

#### Output

```json
{
    "department_name": "FINANCE (PENSION-A) DEPARTMENT",
    "go_number": "353/2016/Fin",
    "date": "01.09.2016"
}
```

---

# 🇮🇳 Malayalam NER

A separate **XLM-RoBERTa** model was trained for Malayalam Government Orders.

The complete workflow includes:

- Weak Supervision
- Automatic Annotation
- BIO Label Generation
- XLM-RoBERTa Fine-tuning
- Metadata Extraction

### Extracted Entities

- Department Name
- GO Number
- Date

---

# 🤖 AI Assistant

The AI Assistant is built using **LangChain** and **LangGraph**.

Unlike the NER models, it analyzes the complete document and generates intelligent responses.

### Capabilities

- Department Name
- GO Number
- Date
- Document Summary
- Key Highlights
- Natural Language Question Answering
- Context-aware Responses

### Example Questions

```
Summarize this Government Order.

Which department issued this order?

What is the GO Number?

What is the purpose of this document?

When was this Government Order issued?
```

---

# 🌐 Web Application

The project includes a user-friendly web interface.

Users can:

- Upload a Government Order
- Select English NER
- Select Malayalam NER
- Use the AI Assistant
- View extracted metadata
- Generate summaries
- Ask questions about the document

---

# 📸 Screenshots

## 🏠 Home Page

> <img width="1914" height="976" alt="image" src="https://github.com/user-attachments/assets/0c2d3b1a-1bce-4ec6-862f-81fadec92011" />
> <img width="1897" height="955" alt="image" src="https://github.com/user-attachments/assets/4c00189c-b999-406a-ad78-b803bff30bb5" />



---

## 📤 Upload Document

> <img width="1884" height="949" alt="image" src="https://github.com/user-attachments/assets/36880840-fea1-4ad1-a8cf-b7dea5b3a16d" />


---

## 🇬🇧 English NER Output

> <img width="1909" height="971" alt="image" src="https://github.com/user-attachments/assets/810b8e62-b5f8-48ce-9f38-b0299dd35d75" />


---

## 🇮🇳 Malayalam NER Output

> <img width="1902" height="969" alt="image" src="https://github.com/user-attachments/assets/1241c3b2-44cc-41f6-a31c-9d47b97ae337" />


---

## 🤖 AI Assistant

> <img width="1905" height="934" alt="image" src="https://github.com/user-attachments/assets/24348257-525c-4319-88cf-5198d6f8a64a" />


---

## 📝 Document Summary

> <img width="1890" height="950" alt="image" src="https://github.com/user-attachments/assets/ad2cf675-6d5e-46e3-a4f6-5d45198a9965" />


---

# 📂 Repository Structure

```text
Kerala-GO-AI/
│
├── backend/                     # Backend API and AI Assistant
│
├── frontend/                    # Web Application
│
├── mal_geo_ner/                 # Malayalam NER Model
│   └── Malayalam NER Notebook
│
├── geo_ner.ipynb                # English NER Model
├── auto_label.py                # Weak Supervision Dataset Generation
├── train_model.py               # Model Training
├── run_batch.py                 # Batch Prediction
├── test_unseen.py               # Testing on Unseen Documents
├── train.json                   # Training Dataset
├── val.json                     # Validation Dataset
├── 1.ipynb                      # Experimental Notebook
├── backend.log
├── README.md
└── .gitignore
```

---

# 🛠️ Technologies Used

### Programming

- Python

### Machine Learning

- PyTorch
- Hugging Face Transformers
- XLM-RoBERTa

### AI

- LangChain
- LangGraph

### Data Processing

- Pandas
- NumPy
- Scikit-learn
- Regular Expressions (Regex)

### Web Development

- HTML
- CSS
- JavaScript
- Flask *(or your backend framework, if applicable)*

### Development Tools

- Jupyter Notebook
- Git
- GitHub

---

# ⚙️ Installation

Clone the repository

```bash
git clone https://github.com/Adnan00707/<repository-name>.git
```

Move into the project directory

```bash
cd <repository-name>
```

Install dependencies

```bash
pip install -r requirements.txt
```

Start the backend

```bash
python backend/app.py
```

Start the frontend

```bash
cd frontend
npm install
npm start
```

---

# 🚀 Usage

1. Launch the web application.
2. Upload a Government Order.
3. Choose one of the following modes:
   - English NER
   - Malayalam NER
   - AI Assistant
4. View the extracted information or AI-generated response.

---

# 🔮 Future Work

- OCR support for scanned Government Orders
- Additional Government Order formats
- Better multilingual support
- Retrieval-Augmented Generation (RAG)
- Cloud Deployment
- REST API
- Advanced Search
- Export Results to PDF

---

# 👨‍💻 Author

**Adnan Soni**

B.Tech in Computer Science and Engineering (AI & Data Science)

Indian Institute of Information Technology Kottayam

📧 Email: adnansoni2020@gmail.com

🐙 GitHub: https://github.com/Adnan00707

---

# 📜 License

This project is intended for educational and research purposes.
