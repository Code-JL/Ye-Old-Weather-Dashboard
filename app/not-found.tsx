export default function NotFound() {
  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(to bottom, #f3f4f6, #e5e7eb)',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
              404 - Page Not Found
            </h1>
            <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>
              Alas, the page ye seek doth not exist in this realm.
            </p>
            <a 
              href="/"
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                background: '#1f2937',
                color: '#ffffff',
                borderRadius: '0.5rem',
                textDecoration: 'none'
              }}
            >
              Return to Homepage
            </a>
          </div>
        </div>
      </body>
    </html>
  );
} 