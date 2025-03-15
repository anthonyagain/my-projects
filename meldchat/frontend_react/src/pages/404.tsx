import React, { useEffect } from 'react';

export const NotFoundPage = () => {
  useEffect(() => {
    // Create the <style> tag
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
      body {
        color: #000;
        background: #fff;
        margin: 0;
      }
      .next-error-h1 {
        border-right: 1px solid rgba(0, 0, 0, .3);
      }
      @media (prefers-color-scheme: dark) {
        body {
          color: #fff;
          background: #000;
        }
        .next-error-h1 {
          border-right: 1px solid rgba(255, 255, 255, .3);
        }
      }
      .font-404-page * {
        font-family: system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji" !important;
      }
    `;
    // Append the <style> element to the document head
    document.head.appendChild(style);

    // Cleanup function to remove the style tag when the component unmounts
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div id="__next">
      <div className="font-404-page" style={{ height: '100vh', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ lineHeight: '48px' }}>
          <h1 className="next-error-h1" style={{ display: 'inline-block', margin: '0 20px 0 0', paddingRight: '23px', fontSize: '24px', fontWeight: '500', verticalAlign: 'top' }}>404</h1>
          <div style={{ display: 'inline-block' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '400', lineHeight: '28px' }}>This page could not be found.</h2>
          </div>
        </div>
      </div>
    </div>
  );
}
