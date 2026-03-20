import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('Verifying your email...');
  const hasVerified = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided in the link.');
      return;
    }

    // Prevent double-firing in React 18 strict mode
    if (hasVerified.current) return;
    hasVerified.current = true;

    const verifyToken = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully! You can now log in.');
          // Optional: Auto redirect to login after a few seconds
          setTimeout(() => navigate('/login'), 4000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed. The token may be invalid or expired.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('A network error occurred while verifying the email.');
      }
    };

    verifyToken();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Account Verification
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          {status === 'loading' && (
            <div className="flex flex-col items-center">
              <svg className="animate-spin h-10 w-10 text-teal-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600 font-medium">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center">
              <svg className="h-14 w-14 text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-700 font-medium mb-6">{message}</p>
              <p className="text-sm text-gray-500 mb-4">Redirecting to login shortly...</p>
              <Link to="/login" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500">
                Go to Login Now
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center">
              <svg className="h-14 w-14 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 font-medium mb-6">{message}</p>
              <Link to="/signup" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-teal-600 bg-white hover:bg-gray-50 border-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500">
                Return to Signup
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
