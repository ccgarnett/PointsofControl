import '@testing-library/jest-dom';

// react-router v7 development build requires TextEncoder/TextDecoder
const { TextEncoder, TextDecoder } = require('util');
Object.assign(global, { TextEncoder, TextDecoder });
