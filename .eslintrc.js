module.exports = {
<<<<<<< HEAD
  root: true,
  env: {
    browser: true,
    node: true,
    es6: true
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  plugins: ['react', 'react-hooks'],
=======
  extends: ['react-app'],
>>>>>>> eefdd63bae29483e3d03628a2a9d444608d67913
  rules: {
    'react/prop-types': 'off',
    'no-unused-vars': 'warn',
    'react/react-in-jsx-scope': 'off',
<<<<<<< HEAD
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react/no-unescaped-entities': 'warn'
=======
    'react/no-unescaped-entities': ['error', {
      'forbid': [
        {
          'char': '>',
          'alternatives': ['&gt;']
        },
        {
          'char': '}',
          'alternatives': ['&#125;']
        }
      ]
    }]
>>>>>>> eefdd63bae29483e3d03628a2a9d444608d67913
  }
}; 