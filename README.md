# Learning SQL Environment

This project provides a simple PostgreSQL setup using Docker to help you learn SQL.

## Prerequisites

- Docker
- Docker Compose
- Make (optional, but recommended for using the Makefile)

## Quick Start
    
1.  **Start the environment (Database + Web App):**
    ```bash
    make up
    ```
    This will start the PostgreSQL database and the Next.js web application.
    - Web App: [http://localhost:3000](http://localhost:3000)
    - Database Port: 5432

2.  **Use the Web App:**
    Open [http://localhost:3000](http://localhost:3000) in your browser.
    - Create a new session.
    - Type SQL commands (e.g., `SELECT now();`) and see the results in a chat-like interface.
    - Conversaions are saved as Markdown files in the `web/conversations` directory.

3.  **Connect to the database terminal (optional):**
    If you prefer the command line:
    ```bash
    make psql
    ```

4.  **Stop the environment:**
    ```bash
    make down
    ```

## Makefile Commands

- `make up`: Starts the PostgreSQL container and Web App in the background.
- `make down`: Stops the containers.
- `make logs`: Follows the container logs.
- `make psql`: Connects to the running database shell.
- `make clean`: Stops the container and **deletes the data volume**. Use with caution!

## Database Details

- **Host:** localhost (from host machine) or `db` (from web container)
- **Port:** 5432
- **User:** admin
- **Password:** password
- **Database:** learning_db

