import { auth0Config } from '@/config/auth0-config';
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, useContext, useEffect, useState } from 'react';

WebBrowser.maybeCompleteAuthSession();

type User = {
    id: string;
    name: string;
    email: string;
    picture?: string;
};

type AuthContextType = {
    user: User | null;
    isLoading: boolean;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
    error: string | null;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    signIn: async () => { },
    signOut: async () => { },
    error: null,
});

export const useAuth = () => useContext(AuthContext);

const CREDENTIALS_KEY = 'auth0_credentials';
const auth0Domain = auth0Config.domain;

// Auth0 configuration for Universal Login
const redirectUri = AuthSession.makeRedirectUri();

const discovery = {
    authorizationEndpoint: `https://${auth0Domain}/authorize`,
    tokenEndpoint: `https://${auth0Domain}/oauth/token`,
    revocationEndpoint: `https://${auth0Domain}/oauth/revoke`,
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [request, result, promptAsync] = AuthSession.useAuthRequest(
        {
            clientId: auth0Config.clientId,
            scopes: ['openid', 'profile', 'email'],
            redirectUri,
        },
        discovery
    );

    // Check for stored credentials on mount
    useEffect(() => {
        checkStoredCredentials();
    }, []);

    // Handle auth response
    useEffect(() => {
        if (result?.type === 'success') {
            const { code } = result.params;
            exchangeCodeForToken(code);
        } else if (result?.type === 'error') {
            setError('Authentication failed. Please try again.');
            setIsLoading(false);
        }
    }, [result]);

    const checkStoredCredentials = async () => {
        try {
            const storedCreds = await SecureStore.getItemAsync(CREDENTIALS_KEY);
            if (storedCreds) {
                const credentials = JSON.parse(storedCreds);
                // Verify token is still valid by fetching user info
                const userInfo = await fetchUserInfo(credentials.access_token);
                if (userInfo) {
                    setUser(userInfo);
                }
            }
        } catch (err) {
            // Token expired or invalid, clear it
            await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
        } finally {
            setIsLoading(false);
        }
    };

    const exchangeCodeForToken = async (code: string) => {
        try {
            setIsLoading(true);

            // Get the code verifier from the request
            const codeVerifier = request?.codeVerifier;

            if (!codeVerifier) {
                throw new Error('Code verifier not found');
            }

            const tokenResponse = await fetch(`https://${auth0Domain}/oauth/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    grant_type: 'authorization_code',
                    client_id: auth0Config.clientId,
                    code,
                    redirect_uri: redirectUri,
                    code_verifier: codeVerifier,
                }),
            });

            const tokens = await tokenResponse.json();

            if (!tokenResponse.ok) {
                throw new Error(tokens.error_description || 'Failed to get tokens');
            }

            // Store credentials securely
            await SecureStore.setItemAsync(CREDENTIALS_KEY, JSON.stringify(tokens));

            // Get user info
            const userInfo = await fetchUserInfo(tokens.access_token);
            if (userInfo) {
                setUser(userInfo);
            }
        } catch (err: any) {
            console.error('Token exchange error:', err);
            setError(err.message || 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUserInfo = async (accessToken: string): Promise<User | null> => {
        try {
            const response = await fetch(`https://${auth0Domain}/userinfo`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user info');
            }

            const userInfo = await response.json();
            return {
                id: userInfo.sub || '',
                name: userInfo.name || userInfo.email || 'User',
                email: userInfo.email || '',
                picture: userInfo.picture,
            };
        } catch (err) {
            return null;
        }
    };

    const signIn = async () => {
        try {
            setError(null);
            setIsLoading(true);

            // Log the redirect URI for debugging
            console.log('Redirect URI:', redirectUri);

            await promptAsync();
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Login failed');
            setIsLoading(false);
        }
    };

    const signOut = async () => {
        try {
            await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
            setUser(null);
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, signIn, signOut, error }}>
            {children}
        </AuthContext.Provider>
    );
};
