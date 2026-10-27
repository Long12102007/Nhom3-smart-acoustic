# Smart Acoustic Baby Cry - Nhom 3
### Intelligent Baby Cry Detection and Monitoring System

An intelligent baby-cry detection system that integrates embedded hardware, audio classification, and a mobile application to support baby monitoring.

---

## 1. Project Overview

**Smart Acoustic Baby Cry** is a project focused on detecting baby crying sounds using audio processing and machine learning technologies.

The system combines an ESP32 microcontroller, an INMP441 digital microphone, an AI-based audio classification model, Firebase services, and a mobile application developed with React Native and TypeScript.

The project aims to provide a practical solution for detecting baby crying sounds and supporting monitoring and notification features through a mobile application.

### Project Objectives

- Acquire audio signals using the INMP441 microphone and ESP32.
- Develop an audio classification model to distinguish baby crying from background sounds.
- Integrate the hardware and application with Firebase where required.
- Develop a mobile application for monitoring and notification features.
- Evaluate the system using collected audio data and testing results.

---

## 2. Technologies and Components

| Category | Technologies / Components |
|---|---|
| Microcontroller | ESP32 |
| Audio Sensor | INMP441 I2S Microphone |
| Mobile Application | React Native |
| Programming Language | TypeScript |
| Backend Services | Firebase |
| Machine Learning | Edge Impulse |
| Audio Processing | Digital Audio Processing and Feature Extraction |
| Version Control | Git and GitHub |

---

## 3. System Architecture

The project consists of three main components.

### 3.1 Hardware and Audio Acquisition

The ESP32 works with the INMP441 digital microphone to acquire audio signals from the surrounding environment.

The captured audio is used as input for the project's audio processing and baby-cry detection workflow.

### 3.2 AI Model

The machine learning component is designed to classify audio into baby-cry and non-baby-cry categories.

Edge Impulse is used to support dataset preparation, feature extraction, model training, and evaluation.

### 3.3 Mobile Application and Firebase

The mobile application is developed using React Native and TypeScript.

Firebase provides backend services for the application's supported data and connectivity features.

The application is designed to support monitoring and notification functions according to the implemented features.

> Note: The actual inference location and data flow depend on the final implementation. Update this section if the AI model runs directly on the ESP32, on a separate server, or through another deployment architecture.

---

## 4. Project Structure

The repository is organized into the following directories.

| Directory / File | Description |
|---|---|
| `src/` | Mobile application source code |
| `assets/` | Application images, audio, and other assets |
| `android/` | Android project configuration |
| `scripts/` | Development and utility scripts |
| `reports/` | Daily development reports and progress logs |
| `docs/` | Project documentation and management documents |
| `presentation/` | PowerPoint presentation |
| `hardware/` | Hardware documentation, circuit diagrams, and firmware |
| `ai-model/` | AI model documentation and evaluation information |
| `README.md` | Main project documentation |
| `package.json` | Application dependencies and scripts |
| `app.json` | Expo application configuration |
| `tsconfig.json` | TypeScript configuration |
| `eas.json` | Expo Application Services configuration |

Some directories may be added as the project develops. Refer to the actual repository contents for the latest structure.

---

## 5. Project Management

### 5.1 Daily Progress Reports

The `reports/` directory contains daily development reports documenting the team's work throughout the project.

These reports may include:

- Tasks completed each day.
- Development progress.
- Technical problems and solutions.
- Hardware and software implementation updates.
- Testing activities and results.

**Directory:** `reports/`

### 5.2 Project Timeline

The project timeline summarizes the planned activities, milestones, and overall progress of the project.

It provides an overview of the project's development from the initial planning stage to the final implementation and testing stages.

**Project Timeline:** [(docs/Bang_tien_do.xlsx)](https://docs.google.com/spreadsheets/d/1kP9JVAiK_WzFUSlu3VnuZOg3w0rbTsxO/edit?gid=402387531#gid=402387531)

### 5.3 Team Task Assignment

The team task assignment document describes the distribution of responsibilities among team members.

It helps track individual contributions and coordinate the hardware, AI model, mobile application, documentation, and testing activities.

**Team Task Assignment:** [(docs/Bang_phan_nv.xlsx)](https://docs.google.com/spreadsheets/d/1qQWCua74gzCp8dxZ-vZoD6xFgJCn_SCl/edit?gid=727585442#gid=727585442)

---

## 6. Technical Documentation

The `docs/` and `reports/` directories contain the supporting documents for the project.

The documentation may include:

- Project overview and requirements.
- System architecture diagrams.
- Hardware connection diagrams.
- AI model development and evaluation results.
- Application design and implementation.
- Installation and usage instructions.
- Testing results and technical reports.

These documents provide additional information about the design, implementation, and evaluation of the system.

---

## 7. Project Presentation

The PowerPoint presentation summarizes the project's objectives, technologies, system architecture, implementation, and evaluation.

It is intended to support the final project presentation and provide a concise overview of the work completed by the team.

**Presentation Slides:** [(presentation/Trợ_ý_Giám_sát_Trẻ_em_bằng_âm_thanh.pptx)](https://docs.google.com/presentation/d/1z4oR5CtuTfwQapvTDruGNIkLE4UZ7Dfy/edit?slide=id.p1#slide=id.p1)

---

## 8. Project Demonstration

The demonstration video presents the implemented features and the system's operation.

**YouTube Demo:** [Watch Project Demonstration] https://youtu.be/JIVJfMNz6M0

The video should demonstrate the actual functionality of the completed prototype.

---

## 9. Installation and Setup

### Prerequisites

Before running the mobile application, ensure that the development environment contains the required versions of:

- Node.js.
- npm.
- The development tools required by the project's React Native and Expo configuration.

### Install Dependencies

Clone the repository and navigate to the project directory.

```bash
git clone ADD_GITHUB_REPOSITORY_URL_HERE
cd SMART-ACOUSTIC
npm install
```

Configure the required application and Firebase settings according to the project's implementation.

### Run the Application

Use the scripts defined in `package.json` to start the application.

For example, if the project uses the standard Expo start script:

```bash
npx expo start
```

Refer to the existing project configuration and installation instructions if additional setup is required.

---

## 10. Testing and Evaluation

The project evaluation may cover the following areas:

- Audio acquisition using the ESP32 and INMP441 microphone.
- Baby-cry and background-sound classification.
- AI model performance using validation and test datasets.
- Firebase connectivity and data exchange.
- Mobile application functionality.
- Notification behavior.
- Integration between the hardware, AI model, backend services, and mobile application.

The actual evaluation results and performance metrics should be documented in the relevant files under `reports/` or `ai-model/`.

---

## 11. Project Links

| Resource | Link |
|---|---|
| GitHub Repository | [(https://github.com/Long12102007/smart-acoustic) |
| YouTube Demonstration | (https://youtu.be/JIVJfMNz6M0) |
| Project Timeline | [(docs/Bang_tien_do.xlsx)](https://docs.google.com/spreadsheets/d/1kP9JVAiK_WzFUSlu3VnuZOg3w0rbTsxO/edit?gid=402387531#gid=402387531) |
| Team Task Assignment | [(docs/Bang_phan_cong_nv.xlsx)](https://docs.google.com/spreadsheets/d/1qQWCua74gzCp8dxZ-vZoD6xFgJCn_SCl/edit?gid=727585442#gid=727585442) |
| PowerPoint Presentation | [(presentation/Trợ_ý_Giám_sát_Trẻ_em_bằng_âm_thanh.pptx)](https://docs.google.com/presentation/d/1z4oR5CtuTfwQapvTDruGNIkLE4UZ7Dfy/edit?slide=id.p1#slide=id.p1) |

---

## 12. Final Submission

The official final submission document is provided separately in PDF format.

The PDF contains the essential project information and the GitHub repository link.

The GitHub repository serves as the central location for the source code, technical documentation, daily progress reports, project management documents, presentation slides, and demonstration link.

---

## 13. Project Information

**Project Name:** Smart Acoustic Baby Cry

**Team:** Group 3 : Lê Đỗ Minh Chiến, Huỳnh Ngọc Bảo Long

**Project Type:** Embedded Systems, Audio Processing, Machine Learning, and Mobile Application Development

**Academic Year:** 2026–2027

**Repository:** GitHub
