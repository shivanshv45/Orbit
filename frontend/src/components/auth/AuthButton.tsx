import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { motion } from 'framer-motion';

export function AuthButton() {
    return (
        <>
            <SignedOut>
                <SignInButton mode="modal">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 rounded-lg bg-card border border-border hover:bg-accent/50 text-foreground text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        Sign In
                    </motion.button>
                </SignInButton>
            </SignedOut>
            <SignedIn>
                <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                        elements: {
                            avatarBox: "w-10 h-10 rounded-lg border-2 border-primary/20",
                            userButtonPopoverCard: "bg-background border border-border shadow-2xl",
                            userButtonPopoverActionButton: "hover:bg-accent/50 text-foreground",
                            userButtonPopoverActionButtonText: "text-foreground",
                            userButtonPopoverFooter: "hidden",
                        }
                    }}
                />
            </SignedIn>
        </>
    );
}
