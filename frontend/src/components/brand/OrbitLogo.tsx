import { Link } from 'react-router-dom';
import logoImg from '@/assets/orbit_logo_v6.jpg';

interface OrbitLogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function OrbitLogo({ className = '', size = 'md' }: OrbitLogoProps) {
    // Size mapping
    const sizeClasses = {
        sm: 'w-10 h-10', // 40px
        md: 'w-12 h-12', // 48px
        lg: 'w-16 h-16', // 64px
    };

    const imgSize = sizeClasses[size];

    return (
        <Link to="/" className={`group flex items-center gap-4 cursor-pointer select-none ${className}`}>
            {/* Logo Container with 3D layers */}
            <div className="relative flex items-center justify-center">

                {/* Layer 1: The Atmosphere (Deep Nebula Glow) */}
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/30 to-purple-600/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700 scale-50 group-hover:scale-150" />

                {/* Layer 2: The Orbital Ring (Gyroscope) */}
                <div className="absolute inset-[-6px] rounded-full border-2 border-primary/60 border-t-transparent border-l-transparent opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-[180deg]" />

                {/* Layer 3: The Second Ring (Counter-rotation) */}
                <div className="absolute inset-[-2px] rounded-full border border-cyan-400/40 border-b-transparent border-r-transparent opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-1000 ease-out group-hover:-rotate-[90deg] delay-75" />

                {/* Layer 4: The Planet (Logo) */}
                <img
                    src={logoImg}
                    alt="Orbit Logo"
                    className={`relative z-10 ${imgSize} object-cover rounded-full shadow-2xl transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-[360deg]`}
                />
            </div>

            {/* Text Container */}
            <div className="relative flex flex-col">
                <span className="text-xl font-extrabold uppercase tracking-tight text-foreground transition-all duration-500 group-hover:tracking-widest group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:via-cyan-300 group-hover:to-purple-400">
                    Orbit
                </span>
                {/* The Beam (Scanline) */}
                <div className="h-[2px] w-0 bg-gradient-to-r from-cyan-400 to-purple-600 group-hover:w-full transition-all duration-500 ease-out" />
            </div>
        </Link>
    );
}
