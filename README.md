# AI Study Hub FPT

## Overview

AI Study Hub FPT is an AI-powered academic resource sharing platform developed for FPT University students.

The system provides a centralized environment where students can:

* Upload and manage study materials
* Search and browse academic resources
* Organize documents into folders
* Share documents with other students
* Bookmark and rate useful materials
* Discuss documents through comments
* Interact with AI to understand learning content
* Purchase premium subscription plans for extended features

The platform aims to solve the problem of learning materials being scattered across multiple channels such as Facebook Groups, Messenger, Google Drive, Email, and personal devices.

---

## Objectives

### Main Goals

* Centralize learning resources
* Improve document discoverability
* Encourage academic sharing among students
* Integrate AI-powered learning assistance
* Provide a secure and scalable platform

### Target Users

* FPT University Students
* Academic Communities
* System Administrators

---

# Key Features

## User Management

* Register account
* Login / Logout
* Manage profile
* Student identity verification
* Role-based authorization

---

## Document Management

* Upload documents
* Edit document information
* Delete documents
* Organize documents into folders
* Categorize documents
* Tag documents
* Browse documents
* Search documents
* Preview documents
* Download documents

---

## Community Features

* Comment on documents
* Rate documents
* Add documents to favorites
* Share documents with other users
* Report inappropriate documents

---

## AI Features

### AI Chat Assistant

Users can:

* Ask questions about uploaded materials
* Receive AI-generated explanations
* Learn concepts faster through contextual AI responses

### Current AI Scope

The system currently supports:

* AI Chat with document context

The following features are intentionally not persisted:

* AI Summary
* AI Flashcards
* AI Quiz

Generated content is returned in real-time and discarded afterward.

---

## Subscription Features

### Free Plan

* Limited storage
* Limited AI requests

### Pro Plan

* Increased storage
* More AI requests

### Premium Plan

* Maximum storage
* Extended AI usage

---

## Admin Features

### User Management

* Manage users
* Review student verification requests

### Document Moderation

* Review uploaded documents
* Approve documents
* Reject documents

### Report Management

* Review user reports
* Resolve violations

### System Management

* Manage majors
* Manage courses
* Manage categories
* Manage subscription plans

---

# System Architecture

## External Systems

### Gemini AI API

Used for:

* AI Chat Processing
* Context-Aware Responses

### Firebase Storage

Used for:

* File Storage
* Document Assets
* Thumbnail Storage

---

# Technology Stack

## Frontend

* ReactJS
* Tailwind CSS

## Backend

* Java Spring Boot
* Spring Security
* JWT Authentication
* RESTful API

## Database

* MySQL

## Storage

* Firebase Storage

## AI

* Google Gemini API

## Version Control

* Git
* GitHub

---

# Database Overview

## Main Modules

### Authentication

* users
* roles
* user_roles
* refresh_tokens
* student_verifications

### Academic Structure

* majors
* courses

### Document Management

* folders
* documents
* document_categories
* tags
* document_tags

### Community

* comments
* favorites
* document_ratings
* document_shares
* reports

### Analytics

* document_views
* document_downloads
* activity_logs

### AI Module

* chat_sessions
* chat_messages

### Subscription

* subscription_plans
* user_subscriptions

### Notification

* notifications

---

# Main Use Cases

## Student

* Register
* Login
* Verify Student Identity
* Manage Profile
* Upload Document
* Manage Documents
* Browse Documents
* Search Documents
* Preview Document
* Download Document
* Share Document
* Comment Document
* Add to Favorites
* Rate Document
* Report Document
* Chat with AI
* View Chat History
* Purchase Subscription

---

## Admin

* Manage Users
* Review Documents
* Approve Documents
* Reject Documents
* Review Reports
* Review Student Verification
* Manage Courses
* Manage Categories
* Manage Subscription Plans

---

# Project Structure

```text
AIStudyHubFPT
│
├── frontend
│   ├── components
│   ├── pages
│   ├── services
│   ├── hooks
│   └── assets
│
├── backend
│   ├── controller
│   ├── service
│   ├── repository
│   ├── entity
│   ├── dto
│   ├── config
│   └── security
│
├── database
│   ├── schema.sql
│   └── seed.sql
│
├── docs
│   ├── SRS
│   ├── ERD
│   ├── UseCaseDiagram
│   ├── ContextDiagram
│   └── API
│
└── README.md
```

---

# Future Enhancements

* AI Summary Generation
* AI Flashcards Generation
* AI Quiz Generation
* Recommendation Engine
* Vector Search Integration
* Learning Analytics Dashboard
* Mobile Application

---

# Contributors

### SWP391 Project Team

AI Study Hub FPT

FPT University

Summer 2026
