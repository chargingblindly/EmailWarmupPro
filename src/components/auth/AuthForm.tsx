'use client'

import React from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase'

export const AuthForm = () => {
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Welcome to Email Warmup Pro</h2>
      <Auth
        supabaseClient={supabase}
        appearance={{ 
          theme: ThemeSupa,
          style: {
            button: {
              background: '#3b82f6',
              color: 'white',
              borderRadius: '0.375rem',
            },
            anchor: {
              color: '#3b82f6',
            },
          }
        }}
        theme="light"
        providers={[]}
        redirectTo={`${window.location.origin}/dashboard`}
      />
    </div>
  )
}
