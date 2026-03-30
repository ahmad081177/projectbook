# Product Requirements Document: AutoProjectBook (Sefer-Proyekt-Wizard)
## 1. Project Overview
AutoProjectBook is a specialized automation tool designed for Israeli high school students in the Software Engineering major (5 units). It automates the creation of the mandatory Project Book (Sefer Proyekt) for the internal assessment (Questionnaire 899373). By analyzing the student's source code, database schema, and screenshots, the app generates a professional, formatted Word document in Hebrew or Arabic that strictly adheres to the Ministry of Education (MoE) evaluation rubric.1
## 2. Target Audience
* Students: High schoolers (grades 11-12) who have finished their code but struggle with the 40-60 page documentation requirement.
* Teachers: Using the tool to provide students with a consistent documentation template and ensure all mandatory sections (UML, ERD, AI usage) are present.
## 3. Core Functional Requirements
### 3.1. Project Data Ingestion
* Code Upload: Support for folder selection containing C#/ASP.NET Core/Blazor projects.
* Database Extraction:
   * MS Access: Extract metadata about tables, fields, and types.
   * SQL Server: Parse T-SQL scripts to extract comprehensive table and column metadata including relationships.
* Image Gallery: UI to upload screenshots of application screens with accompanying captions for the User Guide.
### 3.2. AI Analysis & Content Generation (Gemini API Integration)
* Logic Summarization: AI analyzes C# classes to describe the business logic and class responsibilities.2
* Database Description: AI generates text descriptions for each table and explains the normalization logic required by the rubric.3
* AI Usage Documentation (Mandatory): Automation of the required section documenting code generated or assisted by AI tools.3
### 3.3. Visual Modeling (Auto-Generation)
* UML Class Diagrams: Automatically generate Mermaid.js code by scanning C# classes and their relationships (Inheritance, Composition).
* ERD Generation: Visualize the database schema based on extracted Primary/Foreign Key relationships.
### 3.4. Document Assembly & Export
* Language Selection: Support for Hebrew (RTL) and Arabic (RTL).4
* Official Template Chapters 3:
   - Cover Page: Logo, student ID, school name, and submission date.
   - Introduction: Project goals and target audience.
   - System Analysis: Functional and non-functional requirements.
   - Database Design: ERD diagram and detailed table structures.
   - Architecture: UML diagrams and layered architecture description.
   - Implementation: Key code snippets with logic explanations.
   - User Guide: Step-by-step instructions using uploaded screenshots.
   - Reflection & Bibliography.
* Format: Export as an editable .docx file using standard fonts (David/Ariel, size 12) with automated Table of Contents.3
## 4. Technical Constraints & Architecture
* Frontend: React 18+ with Vite and TypeScript.
* Styling: Tailwind CSS with full RTL support (logical properties).
* Document Logic: docx-js for browser-side Word generation.
* AI Implementation: Gemini 1.5 Pro API for code and schema context analysis.
* Security: Local-first approach; student code and DB files are processed in-memory to ensure privacy.
## 5. User Journey (Epic Breakdown for BMAD)
### Epic 1: Onboarding & Configuration
* Story 1.1: As a student, I want to select my language (Hebrew/Arabic) and input school details for the cover page.
* Story 1.2: As a student, I want to select my project type (Blazor / Android / WPF) to guide the AI analysis.
### Epic 2: Resource Extraction
* Story 2.1: As a student, I want to upload my MS Access or SQL file so the tool can identify table schemas.
* Story 2.2: As a student, I want to upload my C# source folder to extract class headers and logic.
### Epic 3: Document Content Editing
* Story 3.1: As a student, I want to review and edit the AI-generated logic descriptions.
* Story 3.2: As a student, I want to add captions to my screenshots for the User Guide.
### Epic 4: Final Generation
* Story 4.1: As a student, I want to click "Generate" to receive a structured .docx file that meets all MoE criteria.
## 6. Success Metrics
* Automation Rate: 80% of the textual content is generated automatically.
* Compliance: 100% of documents include mandatory MoE chapters.1
* User Efficiency: Documentation time reduced from weeks to hours.
