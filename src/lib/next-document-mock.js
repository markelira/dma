// Mock for next/document to prevent SSR errors with unframer
// This completely bypasses Next.js's validation for Html component

import React from 'react';

// Create a simple function component that returns null
// This avoids any validation that happens when the component is rendered
function createMockComponent(name) {
  const Component = function(props) {
    // During SSR/build, just return null or children
    if (typeof window === 'undefined') {
      return props?.children || null;
    }
    return props?.children || null;
  };
  Component.displayName = name;
  return Component;
}

// Export mock components
export const Html = createMockComponent('Html');
export const Head = createMockComponent('Head');
export const Main = createMockComponent('Main');
export const NextScript = createMockComponent('NextScript');

// Mock DocumentContext
export const DocumentContext = React.createContext({
  _documentProps: { __NEXT_DATA__: { page: '', query: {} } },
  _devOnlyInvalidateCacheQueryString: '',
});

// Mock DocumentInitialProps
export const DocumentInitialProps = {};

// Default export for Document class
function Document() {
  return null;
}

Document.getInitialProps = async function getInitialProps() {
  return { html: '', head: [], styles: [] };
};

export default Document;
