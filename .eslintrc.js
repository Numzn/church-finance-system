module.exports = {
  extends: ['react-app'],
  rules: {
    'react/prop-types': 'off',
    'no-unused-vars': 'warn',
    'react/react-in-jsx-scope': 'off',
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
  }
}; 