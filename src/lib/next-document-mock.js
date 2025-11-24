// Mock for next/document to prevent SSR errors with unframer
// This file is used as an alias when building for App Router

// Mock Html component - just returns children wrapped in fragment
export const Html = function Html(props) {
  return props.children || null;
};

// Mock Head component
export const Head = function Head(props) {
  return props.children || null;
};

// Mock Main component
export const Main = function Main() {
  return null;
};

// Mock NextScript component
export const NextScript = function NextScript() {
  return null;
};

// Mock DocumentContext
export const DocumentContext = {
  Consumer: function Consumer(props) {
    return props.children ? props.children({}) : null;
  },
  Provider: function Provider(props) {
    return props.children || null;
  },
};

// Mock DocumentInitialProps
export const DocumentInitialProps = {};

// Default export for Document class
function Document() {
  return null;
}

Document.getInitialProps = async function getInitialProps(ctx) {
  return { html: '', head: [], styles: [] };
};

export default Document;
