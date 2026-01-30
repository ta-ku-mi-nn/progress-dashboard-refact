import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);

            const response = await api.post('/auth/login', formData, {
                headers: { 'Content-Type': 'multipart/form-data' } // OAuth2PasswordRequestForm expects form data
            });

            login(response.data.access_token);
            toast.success('Logged in successfully');
        } catch (err: any) {
            console.error(err);
            setError('Login failed. Please check your credentials.');
            toast.error('Login failed');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle>Login</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="grid w-full items-center gap-4">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="username">Username</Label>
                                <Input id="username" placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} />
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />
                            </div>
                        </div>
                    </form>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button onClick={handleSubmit} className="w-full">Sign In</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
