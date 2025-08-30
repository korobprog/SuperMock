#!/bin/bash

# Скрипт для инициализации проектов
# Использование: ./init_project.sh [тип_проекта] [название]

PROJECT_TYPE=${1:-"node"}
PROJECT_NAME=${2:-"my-project"}

echo "🚀 Инициализация проекта: $PROJECT_NAME (тип: $PROJECT_TYPE)"
echo "=================================================="

case $PROJECT_TYPE in
    "node"|"nodejs")
        echo "📦 Создаю Node.js проект..."
        mkdir -p "$PROJECT_NAME"
        cd "$PROJECT_NAME"
        
        # package.json
        cat > package.json << EOF
{
  "name": "$PROJECT_NAME",
  "version": "1.0.0",
  "description": "A Node.js project",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest"
  },
  "keywords": [],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.7.0"
  }
}
EOF

        # index.js
        cat > index.js << EOF
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Hello from $PROJECT_NAME!' });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
EOF

        # .gitignore
        cat > .gitignore << EOF
node_modules/
.env
.DS_Store
*.log
coverage/
dist/
EOF

        # README.md
        cat > README.md << EOF
# $PROJECT_NAME

A Node.js project.

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`bash
npm start
\`\`\`

## Development

\`\`\`bash
npm run dev
\`\`\`
EOF

        echo "✅ Node.js проект создан!"
        echo "📁 Перейдите в папку: cd $PROJECT_NAME"
        echo "📦 Установите зависимости: npm install"
        echo "🚀 Запустите: npm start"
        ;;
        
    "react")
        echo "⚛️ Создаю React проект..."
        mkdir -p "$PROJECT_NAME"
        cd "$PROJECT_NAME"
        
        # package.json
        cat > package.json << EOF
{
  "name": "$PROJECT_NAME",
  "version": "1.0.0",
  "description": "A React project",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
EOF

        # public/index.html
        mkdir -p public
        cat > public/index.html << EOF
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>$PROJECT_NAME</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
EOF

        # src/index.js
        mkdir -p src
        cat > src/index.js << EOF
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

        # src/App.js
        cat > src/App.js << EOF
import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to $PROJECT_NAME</h1>
        <p>Start editing src/App.js to see changes!</p>
      </header>
    </div>
  );
}

export default App;
EOF

        # src/App.css
        cat > src/App.css << EOF
.App {
  text-align: center;
}

.App-header {
  background-color: #282c34;
  padding: 20px;
  color: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
EOF

        # .gitignore
        cat > .gitignore << EOF
# dependencies
node_modules/

# production
build/

# misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*
EOF

        echo "✅ React проект создан!"
        echo "📁 Перейдите в папку: cd $PROJECT_NAME"
        echo "📦 Установите зависимости: npm install"
        echo "🚀 Запустите: npm start"
        ;;
        
    "python")
        echo "🐍 Создаю Python проект..."
        mkdir -p "$PROJECT_NAME"
        cd "$PROJECT_NAME"
        
        # requirements.txt
        cat > requirements.txt << EOF
flask==2.3.3
requests==2.31.0
python-dotenv==1.0.0
pytest==7.4.2
EOF

        # main.py
        cat > main.py << EOF
from flask import Flask, jsonify
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

@app.route('/')
def hello():
    return jsonify({
        'message': 'Hello from $PROJECT_NAME!',
        'status': 'success'
    })

@app.route('/health')
def health():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
EOF

        # .env
        cat > .env << EOF
PORT=5000
DEBUG=True
EOF

        # .gitignore
        cat > .gitignore << EOF
# Byte-compiled / optimized / DLL files
__pycache__/
*.py[cod]
*$py.class

# Virtual environments
venv/
env/
ENV/

# Environment variables
.env

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
EOF

        # README.md
        cat > README.md << EOF
# $PROJECT_NAME

A Python Flask project.

## Installation

\`\`\`bash
pip install -r requirements.txt
\`\`\`

## Usage

\`\`\`bash
python main.py
\`\`\`

## Development

\`\`\`bash
# Создайте виртуальное окружение
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\\Scripts\\activate  # Windows

# Установите зависимости
pip install -r requirements.txt

# Запустите
python main.py
\`\`\`
EOF

        echo "✅ Python проект создан!"
        echo "📁 Перейдите в папку: cd $PROJECT_NAME"
        echo "🐍 Создайте виртуальное окружение: python -m venv venv"
        echo "📦 Установите зависимости: pip install -r requirements.txt"
        echo "🚀 Запустите: python main.py"
        ;;
        
    "docker")
        echo "🐳 Создаю Docker проект..."
        mkdir -p "$PROJECT_NAME"
        cd "$PROJECT_NAME"
        
        # Dockerfile
        cat > Dockerfile << EOF
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
EOF

        # docker-compose.yml
        cat > docker-compose.yml << EOF
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    volumes:
      - .:/app
      - /app/node_modules
    restart: unless-stopped

  # Добавьте другие сервисы по необходимости
  # db:
  #   image: postgres:13
  #   environment:
  #     POSTGRES_DB: myapp
  #     POSTGRES_USER: user
  #     POSTGRES_PASSWORD: password
  #   volumes:
  #     - postgres_data:/var/lib/postgresql/data

# volumes:
#   postgres_data:
EOF

        # .dockerignore
        cat > .dockerignore << EOF
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
EOF

        # package.json (базовый)
        cat > package.json << EOF
{
  "name": "$PROJECT_NAME",
  "version": "1.0.0",
  "description": "A Docker project",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
EOF

        # index.js
        cat > index.js << EOF
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ 
    message: 'Hello from Docker!',
    project: '$PROJECT_NAME',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
EOF

        echo "✅ Docker проект создан!"
        echo "📁 Перейдите в папку: cd $PROJECT_NAME"
        echo "🐳 Соберите образ: docker build -t $PROJECT_NAME ."
        echo "🚀 Запустите: docker-compose up"
        ;;
        
    *)
        echo "❌ Неизвестный тип проекта: $PROJECT_TYPE"
        echo "Доступные типы: node, react, python, docker"
        echo "Пример: ./init_project.sh react my-app"
        exit 1
        ;;
esac

echo ""
echo "🎉 Проект '$PROJECT_NAME' успешно инициализирован!"
echo "📂 Структура создана в папке: $PROJECT_NAME"
