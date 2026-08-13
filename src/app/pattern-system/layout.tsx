import { type ReactNode } from 'react';

export const metadata = {
    title: 'The .500 Method — Pattern System | YourSwami',
    description: 'Real-time MLB W/L alternation analysis. 30 teams scanned daily with 62-99% break probability scoring.',
};

export default function PatternSystemLayout({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
