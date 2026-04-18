# AutoProjectBook — Teacher Guide

**Version 1.0 | April 2026**

---

## Table of Contents

1. [What Is AutoProjectBook?](#what-is-autoprojectbook)
2. [Who Is It For?](#who-is-it-for)
3. [What Does the Generated Document Include?](#what-does-the-generated-document-include)
4. [How to Use It — Step by Step](#how-to-use-it--step-by-step)
   - [Step 1 — Choose Language](#step-1--choose-language)
   - [Step 2 — Setup](#step-2--setup)
   - [Step 3 — Import: Code Upload](#step-3--import-code-upload)
   - [Step 4 — Import: Database Upload](#step-4--import-database-upload)
   - [Step 5 — Import: Screenshots](#step-5--import-screenshots)
   - [Step 6 — Generate Document](#step-6--generate-document)
   - [Step 7 — Review Chapters](#step-7--review-chapters)
   - [Step 8 — Export: Download](#step-8--export-download)
5. [Code Documentation Features](#code-documentation-features)
   - [Code Snippet Panel](#code-snippet-panel)
   - [Key Functions (My Functions)](#key-functions-my-functions)
   - [Call Explanation](#call-explanation)
   - [Recursion and Recursion Tree](#recursion-and-recursion-tree)
   - [Sorting Algorithms](#sorting-algorithms)
   - [Call Stack](#call-stack)
6. [Import and Export in Detail](#import-and-export-in-detail)
7. [Adding Your Own Function](#adding-your-own-function)
8. [Language Support](#language-support)
9. [All Working Features](#all-working-features)

---

## What Is AutoProjectBook?

**AutoProjectBook** is a free, browser-based tool that helps students in the 5-unit Software Engineering major create their mandatory **Sefer Proyekt (ספר פרויקט)** — the official project documentation required by the Israeli Ministry of Education.

Instead of writing a 40–60 page document from scratch, the student uploads their finished C# project files, database schema, and screenshots, and the tool **automatically generates a complete, properly formatted Word document** (.docx) in Hebrew or Arabic — ready to review, finalize, and submit.

The tool uses **AI (Google Gemini or Azure OpenAI)** to read the student's code structure and write natural, relevant text in each chapter. No full source code ever leaves the browser — only class names, method signatures, and table structures are sent to the AI.

> **Key point for teachers:** The tool produces approximately 80% of the document automatically. Students still need to fill in the personal reflection section and add their name to the cover page in Microsoft Word before submitting.

---

## Who Is It For?

| User | Role |
|------|------|
| **Students (primary)** | Grades 11–12, Software Engineering major. Have finished their C# project and need to generate formal documentation. |
| **Teachers** | Guide students through the process, verify that all mandatory sections are present, and evaluate the submitted document. |

The tool runs entirely in the browser — no installation is needed. Students can use it from any school computer or personal laptop with an internet connection (Chrome or Edge recommended).

---

## What Does the Generated Document Include?

The tool generates a Word document structured according to Ministry of Education guidelines. All mandatory chapters are included automatically:

| # | Chapter | What It Contains |
|---|---------|-----------------|
| 1 | **Introduction** | Project goals, target audience, problem statement |
| 2 | **Tech Stack Overview** | Frameworks, languages, and tools used and why |
| 3 | **System Analysis** | Functional and non-functional requirements |
| 4 | **Database** | Table descriptions, column details, ERD diagram |
| 5 | **Server Implementation** | Business logic classes, key code snippets, method explanations |
| 6 | **Client Implementation** | UI structure, components, screen descriptions |
| 7 | **User Guide** | Step-by-step instructions with embedded screenshots |
| 8 | **Reflection** | Personal reflection on the project (student completes in Word) |
| 9 | **Difficulties & Solutions** | Technical challenges faced and how they were resolved |
| 10 | **Future Development** | Proposed improvements and next steps |
| 11 | **Appendices** | Additional class documentation |

---

## How to Use It — Step by Step

The tool is organized as a wizard with 8 steps. A progress bar at the top shows which step the student is on. Completed steps can be clicked to go back and make changes.

---

### Step 1 — Choose Language

The very first screen asks the student to choose the output language for the generated document:

- **עברית (Hebrew)** — The document will be written entirely in Hebrew
- **العربية (Arabic)** — The document will be written entirely in Arabic

The app interface also switches to the chosen language, with full right-to-left (RTL) layout support.

---

### Step 2 — Setup

On this screen, the student fills in the basic information needed to start:

| Field | Description |
|-------|-------------|
| **Student name** | Appears in the document header |
| **AI API key** | Google Gemini API key (free tier available). The key stays in the browser only. |
| **AI model** | Choose a Gemini model — default: `gemini-1.5-pro` |
| **Project type** | Select: ASP.NET / Blazor / WPF / Windows Forms / Android / Other |

A **"Test Key"** button lets the student verify the API key before proceeding — no wasted time if the key is wrong.

> The tool also supports **Azure OpenAI** for schools that use Microsoft Azure. Students enter their Azure endpoint and deployment name instead of a Gemini key.

---

### Step 3 — Import: Code Upload

This is the main import step, where the student brings in their C# project source code.

**How it works:**
1. The student clicks the upload area or drags and drops their **project folder**
2. The tool automatically reads all `.cs` files (and associated `.aspx`, `.cshtml`, `.config` files)
3. Within seconds, a list of all detected **classes, methods, properties, and fields** appears

**What the student sees in the Code Snippet Panel:**
- All parsed classes listed by name
- For each class: its methods, parameters, return types, and access modifiers
- A checkbox to **include or exclude** each class from the documentation
- Auto-excluded items: auto-generated files, migration files, test files

**Marking Key Functions (My Functions):**
Within the class list, the student can mark specific methods as **Key Snippets** — the most important or interesting functions in their project. These are treated specially in the generated document (see [Key Functions](#key-functions-my-functions) below).

Multiple folders can be added if the project is split across more than one folder.

---

### Step 4 — Import: Database Upload

The student imports their database structure so the tool can document the tables, columns, and relationships.

**Supported formats:**

| Format | Details |
|--------|---------|
| MS Access | `.mdb` or `.accdb` file — tables extracted automatically |
| SQL Server / T-SQL | `.sql` file — `CREATE TABLE` statements parsed automatically |
| Manual entry | No file needed — type tables and columns directly into a form |

**What the tool extracts:**
- Table names and descriptions
- Column names, data types, nullability
- Primary keys (PK) and foreign key relationships (FK)

**After uploading**, the student can review and correct everything:
- Edit column names or types
- Add or remove columns
- Write a human-readable description for each table and field
- Mark or unmark PK/FK flags

This reviewed data is used to generate the **Database chapter** and the **ERD diagram**.

---

### Step 5 — Import: Screenshots

The student uploads screenshots of their application to include in the **User Guide** chapter.

**How it works:**
- Drag and drop image files (PNG, JPG, WEBP) or use the file picker
- Up to **30 screenshots**, maximum 5 MB each
- A **Screenshot Carousel** opens automatically, showing each image one at a time at full size

**For each screenshot, the student fills in:**

| Field | Description |
|-------|-------------|
| Caption | Describes what is shown in the screenshot |
| Screen name | The name of the screen (e.g., "Login Page") |
| User type | Admin / Regular User / Both |
| Chapter tag | Which chapter this screenshot belongs to |

The screenshots are embedded directly into the Word document in the User Guide chapter, with their captions as figure labels.

---

### Step 6 — Generate Document

Once all inputs are ready, the student clicks **Generate**. The tool then:

1. Builds a summary of the project (student name, project type, class names, table names, screenshot labels)
2. Sends each chapter's context to the AI — one chapter at a time
3. The AI writes the chapter text in Hebrew or Arabic
4. A **progress list** shows each chapter's generation status in real time
5. Generation typically takes **2–5 minutes** depending on project size

> **What is sent to the AI:** Only the project summary (class names, method signatures, table structures) — never the actual code content. This protects student privacy.
>
> If the AI rate limit is hit, the tool automatically waits and retries.

---

### Step 7 — Review Chapters

After generation is complete, the student enters the review phase:

- A **sidebar** lists all 11 chapters with status badges: ✓ Complete / ⚠ Failed / ○ Pending
- Click any chapter to read the full AI-generated text
- If a chapter needs improvement, click **Regenerate** to ask the AI to rewrite it
- Navigate between chapters using the sidebar

A separate **Diagrams view** shows the generated:
- **ERD diagram** (from the database schema)
- **UML class diagram** (from the C# class structure)

Both diagrams are written in Mermaid syntax and embedded into the Word document as images.

---

### Step 8 — Export: Download

The final step allows the student to download their finished document:

1. A **compliance checklist** shows which mandatory chapters are complete and which are missing
2. Once satisfied, the student clicks **Download .docx**
3. The Word document is assembled entirely in the browser
4. The file opens directly in Microsoft Word for final editing

**What to complete in Word:**
- Cover page (student ID, school name, teacher name, submission date)
- Personal reflection section (must be written by the student — AI cannot write this per MoE rules)
- Bibliography

---

## Code Documentation Features

### Code Snippet Panel

The **Code Snippet Panel** appears after the student uploads their C# files (Step 3). It is the central place where all code-related decisions are made.

The panel shows:
- Every class detected in the uploaded code
- Each class's **methods**, **properties**, and **fields** in a readable list
- Access modifiers (`public`, `private`, `protected`)
- Return types and parameter lists for each method

The student can scroll through the entire codebase class by class, deciding what to include in the generated document.

---

### Key Functions (My Functions)

Within the Code Snippet Panel, the student can mark any method as a **Key Snippet** — these are the functions they want to highlight as the most important parts of their implementation. Think of them as: *"My most important functions."*

**How to mark a key function:**
- In the class list, find the method and check the **"Key Snippet"** checkbox
- Up to **20 functions** can be marked

**What happens in the generated document:**
- Key functions are displayed with a **★** symbol in the Implementation chapter
- Each key function gets its own dedicated section with:
  - The full method signature
  - The function's **Call Explanation** (see below)
  - A description of its role in the system

---

### Call Explanation

For every function marked as a Key Snippet, the AI generates a **Call Explanation** — a clear, plain-language description written in Hebrew or Arabic:

- **What the function does** — its purpose in the system
- **What inputs it receives** (parameters) and what they represent
- **What it returns** or what changes it causes
- **Why this function is important** to the overall application

This explanation is placed directly beside or below the code snippet in the document, making the code readable even for non-programmers.

---

### Recursion and Recursion Tree

If the student's project includes **recursive methods** (functions that call themselves), the tool handles them with special documentation.

**In the Implementation chapter, recursive functions include:**
- A description of the **recursion pattern** used
- The **base case** — the condition that stops the recursion
- The **recursive case** — how the function calls itself step by step
- The purpose and result of the recursion

**Recursion Tree:**
A visual tree structure is included in the documentation showing how the recursive calls expand from the initial call down through each level — for example, showing `factorial(5) → factorial(4) → factorial(3)` and so on. This makes the algorithm's structure immediately visible to evaluators.

---

### Sorting Algorithms

If the student's project contains **sorting algorithms** (Bubble Sort, Selection Sort, Quick Sort, Merge Sort, etc.), the AI will:

- Identify the sorting logic from the uploaded code
- **Name and explain** the algorithm used
- Describe how data flows through the sort
- Include a step-by-step trace of a sample input through the algorithm in the documentation

This ensures the Implementation chapter accurately reflects the algorithmic work the student has done — one of the key evaluation criteria.

---

### Call Stack

For functions that call multiple other functions, the document includes a **Call Stack** section showing the chain of method calls:

- The **starting method** (entry point)
- Which methods it calls, and in what order
- Any nested calls within those methods
- The final result or return value

This section makes it easy for evaluators to follow the program's execution path and understand how the different parts of the system work together.

---

## Import and Export in Detail

### Import — Uploading Files

The tool supports three distinct import flows:

**Code Import (Step 3):**
- Upload a C# project folder (all `.cs` files are detected automatically)
- Additional file types also supported: `.aspx`, `.cshtml`, `.config`, `.css`, `.js`
- Multiple folders can be added to combine a multi-folder project
- Files are processed entirely in the browser — nothing is uploaded to a server

**Database Import (Step 4):**
- MS Access files (`.mdb`, `.accdb`) — tables and relationships extracted automatically
- SQL Server T-SQL scripts (`.sql`) — `CREATE TABLE` statements parsed
- Manual entry option for students with no database file

**Screenshots Import (Step 5):**
- Image files: PNG, JPG, WEBP
- Up to 30 images, max 5 MB each
- Drag-and-drop or file picker
- Carousel editor for captioning

---

### Export — Downloading the Document

When the student clicks **Download .docx**, the tool:

1. Assembles all generated chapter text into a structured Word document
2. Embeds the C# class structures and code snippets with proper formatting
3. Inserts ERD and UML diagrams as images
4. Embeds screenshots in the User Guide chapter
5. Applies full RTL formatting (right-to-left) throughout
6. Uses David MT font, size 12, 1.5 line spacing with 2.5 cm margins

The result is a ready-to-edit `.docx` file that opens in Microsoft Word.

---

## Adding Your Own Function

Sometimes a student wants to manually ensure a specific function is documented — for example, a function that was not detected automatically or one that they consider the most important part of their project.

**How to do it:**

1. Go back to **Step 3 — Code Upload** (click the completed step in the wizard header)
2. In the **Code Snippet Panel**, find the class that contains your function
3. If the class was excluded, uncheck the **Exclude** checkbox to include it
4. Find the specific method in the class's method list
5. Check the **Key Snippet** checkbox next to that method
6. Proceed through the wizard — the AI will generate a dedicated **Call Explanation** for that function in the Implementation chapter

> You can add multiple custom functions. The maximum is 20 key snippets total across all classes.

---

## Language Support

AutoProjectBook supports two output languages, both with full right-to-left (RTL) layout:

| Language | Interface | Document | Direction |
|----------|-----------|----------|-----------|
| **Hebrew (עברית)** | ✅ Hebrew UI | ✅ Hebrew document text | RTL |
| **Arabic (العربية)** | ✅ Arabic UI | ✅ Arabic document text | RTL |

**What changes with the language setting:**
- All UI labels, buttons, and messages switch to the chosen language
- The AI writes all chapter text in that language
- Chapter headings follow the official MoE naming in the target language
- The Word document is formatted with RTL paragraph direction throughout
- Numbers and code lines retain left-to-right direction within RTL text (as is standard)

Language can be changed at any time by going back to Step 1 (click the step circle in the header).

---

## All Working Features

The following features are fully implemented and working in AutoProjectBook:

| Feature | Description |
|---------|-------------|
| **Language selection** | Choose Hebrew or Arabic at startup |
| **RTL interface** | Full right-to-left layout for both languages |
| **Student name entry** | Used in the document header |
| **Gemini API key configuration** | With live test button and masked input |
| **Azure OpenAI support** | Alternative AI provider for school use |
| **Gemini model selection** | Choose from known models or enter a custom model name |
| **Project type selection** | ASP.NET / Blazor / WPF / WinForms / Android / Other |
| **C# code folder upload** | Drag-and-drop or directory picker |
| **C# class and method extraction** | Automatic parsing of all `.cs` files |
| **Code Snippet Panel** | View all parsed classes and methods |
| **Class include/exclude controls** | Remove auto-generated or irrelevant classes |
| **Key Snippet marking (My Functions)** | Mark up to 20 functions for detailed documentation |
| **Multi-folder project support** | Combine files from multiple folders |
| **Database file upload** | MS Access `.mdb/.accdb` and SQL Server `.sql` |
| **Manual database entry** | Type tables and columns if no database file available |
| **Table and column review editor** | Edit extracted schema before generating |
| **Screenshot upload** | PNG, JPG, WEBP — up to 30 images |
| **Screenshot carousel editor** | Full-size view with caption and metadata entry |
| **AI document generation** | 11 chapters generated automatically using Gemini or Azure |
| **Real-time generation progress** | Chapter-by-chapter progress list |
| **Automatic retry on rate limit** | Retries up to 3 times with backoff |
| **Recursion documentation** | AI describes recursive algorithms with base case and recursive case |
| **Recursion tree** | Visual tree of recursive calls in the Implementation chapter |
| **Sorting algorithm documentation** | AI identifies and explains sorting logic |
| **Call Stack documentation** | Method call chains documented in the Implementation chapter |
| **Call Explanation (per function)** | AI explanation for every key snippet |
| **Chapter review page** | Read generated text, navigate between chapters |
| **Chapter regeneration** | Re-run AI for any individual chapter |
| **ERD diagram generation** | Entity-Relationship Diagram from database schema (Mermaid) |
| **UML class diagram generation** | Class diagram from C# code structure (Mermaid) |
| **Diagrams preview** | View generated Mermaid diagrams before exporting |
| **Compliance checklist** | See which mandatory chapters are complete before downloading |
| **Word (.docx) export** | Download a formatted, RTL Word document |
| **C# class documentation in Word** | Classes and methods formatted in Courier New in Implementation chapter |
| **Screenshot embedding in Word** | Screenshots included in the User Guide chapter with captions |
| **Clickable step navigation** | Jump to any completed step from the wizard header |
| **Error handling and toast notifications** | Clear feedback for upload errors and API failures |

---

*This guide was prepared to help teachers understand, guide, and evaluate student use of AutoProjectBook.*

*For technical support or suggestions, contact the school's software engineering coordinator.*
