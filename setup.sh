#!/bin/bash

# 1. Ensure you start in the repo root directory

# 2. Initialize npm project if not exist
if [ ! -f package.json ]; then
  npm init -y
fi

# 3. Install dependencies (edit as needed for your stack)
npm install --save react react-dom
npm install --save-dev eslint prettier jest serve

# 4. Add scripts to package.json
npx json -I -f package.json -e '
  this.scripts = {
    "start": "serve -s .",
    "test": "jest",
    "lint": "eslint .",
    "format": "prettier --write ."
  }
'

# 5. Create .github/workflows directory and simple workflow
mkdir -p .github/workflows
cat <<EOF > .github/workflows/nodejs.yml
name: Node.js CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
    - run: npm ci
    - run: npm run lint
    - run: npm test
    - run: npm run build || echo "No build script defined"
EOF

# 6. Create basic ESLint and Prettier config files
cat <<EOF > .eslintrc.json
{
  "env": { "browser": true, "es2021": true },
  "extends": "eslint:recommended",
  "parserOptions": { "ecmaVersion": 12, "sourceType": "module" },
  "rules": {}
}
EOF

cat <<EOF > .prettierrc
{
  "singleQuote": true,
  "semi": true
}
EOF

echo "Project setup complete. Next steps:"
echo "- Customize package.json scripts as needed."
echo "- Add a 'build' script if you use a bundler like webpack or vite."
echo "- Commit and push your changes to GitHub."