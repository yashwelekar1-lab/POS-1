import React, { useState } from 'react';
import {
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';

export const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');

      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google login error:', err);

      // If popup is blocked, fall back to redirect login
      if (
        err?.code === 'auth/popup-blocked' ||
        err?.code === 'auth/popup-cancelled'
      ) {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectError) {
          console.error('Google redirect login error:', redirectError);
        }
      }

      if (err?.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in was cancelled.');
      } else {
        setError('Unable to sign in with Google. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">

          <div className="text-center mb-8">
            <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl font-bold">
                POS
              </span>
            </div>

            <h1 className="text-3xl font-bold text-slate-900">
              Welcome to POS
            </h1>

            <p className="mt-2 text-slate-500">
              Sign in to manage your store
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full h-12 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 transition flex items-center justify-center gap-3 font-semibold text-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="#4285F4"
                    d="M21.35 12.23c0-.79-.07-1.55-.22-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.2 2.91-7.42z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 21.99c2.63 0 4.84-.87 6.45-2.34l-3.14-2.45c-.87.58-1.98.93-3.31.93-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.99z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M6.54 14.1A5.85 5.85 0 0 1 6.23 12c0-.73.13-1.44.31-2.1V7.37H3.3A9.99 9.99 0 0 0 2 12c0 1.67.4 3.24 1.1 4.63l3.44-2.53z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.87c1.43 0 2.72.49 3.73 1.46l2.8-2.8C16.84 2.94 14.63 2 12 2a9.74 9.74 0 0 0-8.7 5.37l3.44 2.53C7.31 7.59 9.46 5.87 12 5.87z"
                  />
                </svg>

                <span>Continue with Google</span>
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <p className="mt-6 text-center text-xs text-slate-400">
            Secure authentication powered by Google
          </p>
        </div>
      </div>
    </div>
  );
};
