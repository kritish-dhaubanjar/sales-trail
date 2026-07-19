
# Sales Trail - Development Setup Guide

Welcome to the **Sales Trail** project. This repository contains the local development environment setup, which relies on Docker for core services, PHP 8.4 for the backend API (Laravel), and a unified `Makefile` to handle build tasks.

---

## 🛠️ Prerequisites

Before starting, ensure you have the following global tools installed on your system:

*   **Docker & Docker Compose**
*   **Homebrew** (for macOS package management)

---

## 🚀 Setup Steps

Follow these steps in sequence to get the application up and running locally.

### 1. Start Infrastructure Services
Spin up the background Docker containers (Database, Redis, etc.) from your main projects directory:
```bash
docker-compose up -d

```

### 2. Configure PHP Version (PHP 8.4)

This project strictly requires **PHP 8.4**. If you don't have it, install `phpvm` (PHP Version Manager) to manage your environments cleanly:

```bash
# Install phpvm
curl -o- [https://raw.githubusercontent.com/Thavarshan/phpvm/main/install.sh](https://raw.githubusercontent.com/Thavarshan/phpvm/main/install.sh) | bash

# Reload your shell configuration
source ~/.zshrc

# Install and set PHP 8.4 as default
phpvm install 8.4
phpvm alias default 8.4
phpvm use

```

*Note: A `.phpvmrc` file containing `"8.4"` will lock this version down for the directory.*

### 3. Install Package Managers & Dependencies

Navigate to the project folder, install Composer, and pull down the project packages:


Install Composer globally via Homebrew (if not already installed)

```
brew install composer
```

### 4. Build and Run the Application

Return to the root directory to trigger the initial builds and start the frontend/asset compilers.

```bash
# Go back to the project root
cd ..

# Build the project
make

# Start the local development server / asset watcher
make watch

```

### 5. Database Migrations and Seeding

Open a new terminal session, navigate to the `api` folder, and run your database setups to populate mock data:

```bash
cd projects/sales-trail/api

# Run database migrations
php artisan migrate

# Seed the database with core data
php artisan db:seed

# (Optional) Seed specific tables individually if needed
php artisan db:seed --class=ItemSeeder

```

---

## 🛠️ Useful Make Commands

* `make` - Runs default build workflows.
* `make watch` - Launches hot-reloading asset compilation scripts.

