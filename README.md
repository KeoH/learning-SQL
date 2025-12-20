    # 🚀 SQL Playground

SQL Playground is an interactive learning environment designed to help you master SQL (PostgreSQL) through a conversational and visual interface. It combines a powerful SQL editor with personal notes and automated Mermaid diagrams to document your learning journey.

## ✨ Features

- **💻 Interactive SQL Console**: Write and execute PostgreSQL queries with real-time results.
- **📊 Mermaid Diagrams**: Create, edit, and render complex diagrams (flowcharts, ERD, etc.) directly in the chat.
- **📝 Personal Notes**: Keep track of your learning by adding persistent Markdown notes to your sessions.
- **🔖 Saved Queries**: Save frequently used or interesting queries for quick access across sessions.
- **🗂️ Session Management**: Organize your work into sessions, each saved as a readable Markdown file.
- **🎨 Premium UI**: Modern dark theme with a clean, responsive design optimized for focus.

## 🛠️ Tech Stack

- **Frontend**: [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [Tailwind CSS 4](https://tailwindcss.com/)
- **Database**: [PostgreSQL 15](https://www.postgresql.org/)
- **Utilities**: [Mermaid.js](https://mermaid.js.org/) (diagrams), [React Markdown](https://github.com/remarkjs/react-markdown) (notes), [Prismjs](https://prismjs.com/) (syntax highlighting)
- **Containerization**: [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)

## 🚀 Quick Start

Ensure you have **Docker** and **Docker Compose** installed.

1.  **Start the environment:**

    ```bash
    make up
    ```

    This launches the PostgreSQL database and the Next.js web application.

    - **Web App**: [http://localhost:3000](http://localhost:3000)
    - **Database Port**: `5432`

2.  **Explore the App:**

    - Open [http://localhost:3000](http://localhost:3000).
    - Create a new session.
    - Run SQL like `SELECT current_timestamp;`.
    - Try adding a diagram with the "Add Diagram" button using Mermaid syntax.

3.  **Command Line Access (Optional):**

    ```bash
    make psql
    ```

4.  **Shut Down:**
    ```bash
    make down
    ```

## 🏗️ Development & Testing

- **Backend Configuration**: Environment variables are managed in `docker-compose.yml`.
- **Unit Testing**: Run tests with `npm test` inside the `web` directory.
- **Code Linting**: Use `npm run lint` to check for code style issues.
- **Clean Environment**: Use `make clean` to stop containers and **wipe the database volume**.

## 🔑 Database Credentials

- **Host**: `localhost` (external) / `db` (internal)
- **Port**: `5432`
- **User**: `admin`
- **Password**: `password`
- **Database**: `learning_db`

---

Made with ❤️ for SQL learners.
