import React, { useState, useEffect, createContext, useContext } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

// Create a non-persistent client for user management to avoid auto-login
const supabaseAccountManager = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    }
});

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

const getProfile = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (error) {
            console.error('Error fetching profile:', error.message);
            return null;
        }
        return data;
    } catch (err) {
        console.error('getProfile crash:', err);
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                fetchProfile(session.user.id);
            } else {
                setIsLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                fetchProfile(session.user.id);
            } else {
                setCurrentUser(null);
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId) => {
        const profile = await getProfile(userId);
        if (profile) {
            setCurrentUser(profile);
        }
        setIsLoading(false);
    };

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    };

    const logout = async () => {
        await supabase.auth.signOut();
    };

    const register = async (userData) => {
        const { email, password, name, role } = userData;
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name, role } }
        });
        if (error) throw error;
        return data;
    };

    const createUser = async (userData) => {
        const { email, password, name, role } = userData;

        // Check if profile exists first to prevent ghost user errors
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('email')
            .eq('email', email)
            .single();

        if (existingProfile) {
            throw new Error('A profile with this email already exists in the management system.');
        }

        const { data, error } = await supabaseAccountManager.auth.signUp({
            email,
            password,
            options: { data: { name, role } }
        });

        if (error) {
            if (error.message.includes('already registered')) {
                throw new Error('This email is already registered in Authentication. Please use the cleanup tool or a different email.');
            }
            throw error;
        }
        return data;
    };

    return (
        <AuthContext.Provider value={{ currentUser, login, logout, register, createUser, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};
