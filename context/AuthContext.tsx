import React, { createContext, useContext, useState, useEffect } from 'react';

type User = {
    id: string;
    name: string;
    email: string;
    provider: 'google' | 'facebook' | 'instagram' | 'guest';
};

type AuthContextType = {
    user: User | null;
    isLoading: boolean;
    signIn: (provider: User['provider']) => Promise<void>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: false,
    signIn: async () => { },
    signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Simulate checking for stored session
    useEffect(() => {
        // In a real app, we check AsyncStorage/SecureStore here
    }, []);

    const signIn = async (provider: User['provider']) => {
        setIsLoading(true);
        // Simulate network delay
        setTimeout(() => {
            setUser({
                id: '123',
                name: 'Test User',
                email: 'test@example.com',
                provider,
            });
            setIsLoading(false);
        }, 1000);
    };

    const signOut = async () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};
