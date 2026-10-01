# Smart Pantry

A full-stack web application designed to help households manage shared pantry inventory, track food items, monitor expiration dates, and generate shopping lists.

## Overview

Smart Pantry was developed as a team project for CS 370: Software Engineering at Radford University.

The application provides a centralized digital pantry where users can manage food items, quantities, expiration dates, and pantry members.

## Features

- User authentication
- Shared pantry management
- Add, update, and remove pantry items
- Track quantities and expiration dates
- Search and filter pantry items
- Low-stock tracking
- Expiration notifications
- Email notification checks
- Shopping list generation
- Add custom shopping-list items
- Copy shopping lists to the clipboard
- User profile management
- MySQL database integration

## Technologies

- JavaScript
- Node.js
- Express.js
- MySQL
- HTML5
- CSS3
- JWT Authentication
- bcrypt
- Chart.js
- Git / GitLab

## Project Structure

```text
smart-pantry/
├── config/
├── controllers/
├── middleware/
├── public/
├── routes/
├── sql/
├── package.json
├── package-lock.json
├── server.js
└── README.md
```

## How It Works

The application uses a Node.js and Express backend connected to a MySQL database. The frontend communicates with authenticated API routes to manage pantry data and user information.

The notification system checks for items that are expiring within seven days or have reached their low-stock threshold.

## My Contributions

This was a collaborative team project. My contributions included working on frontend and backend functionality, including pantry management, shopping-list functionality, and notification-related features.

## Course

**CS 370 — Software Engineering**
Radford University
Team 04

## Future Improvements

- More advanced pantry analytics
- Improved notification delivery
- Additional dietary and allergy-based filtering
- More customizable shopping-list features
- Improved responsive design
