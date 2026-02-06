import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import '@/lib/performance/performance.css'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { initializeUser } from './logic/userSession'
import { ClerkProvider } from '@clerk/clerk-react'


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  console.warn('Clerk publishable key not found. Authentication features will be disabled.');
}

function RootApp() {
  useEffect(() => {
    initializeUser();
  }, []);

  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={clerkPubKey || ''}
      appearance={{
        variables: {
          colorPrimary: '#a78bfa',
          colorBackground: '#09090b',
          colorInputBackground: '#18181b',
          colorInputText: '#fafafa',
          colorText: '#fafafa',
          colorTextSecondary: '#a1a1aa',
          colorDanger: '#ef4444',
          colorSuccess: '#22c55e',
          borderRadius: '1rem',
          fontFamily: 'Inter, system-ui, sans-serif',
        },
        elements: {
          formButtonPrimary:
            'bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium rounded-lg transition-colors',
          card:
            'bg-background border border-border shadow-2xl rounded-2xl',
          headerTitle:
            'text-2xl font-bold text-foreground',
          headerSubtitle:
            'text-muted-foreground',
          socialButtonsBlockButton:
            'bg-card border border-border hover:bg-accent/50 text-foreground rounded-lg',
          formFieldLabel:
            'text-sm font-medium text-foreground',
          formFieldInput:
            'bg-card border border-border text-foreground rounded-lg focus:ring-2 focus:ring-primary/20',
          footerActionLink:
            'text-primary hover:text-primary/80',
          identityPreviewText:
            'text-foreground',
          identityPreviewEditButton:
            'text-primary hover:text-primary/80',
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <RootApp />
      </QueryClientProvider>
    </ClerkProvider>
  </StrictMode>,
)
