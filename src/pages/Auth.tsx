
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';
import { validateEmail, validatePassword, validateName, sanitizeInput } from '@/utils/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Clock } from 'lucide-react';
import { DepartmentSelect } from '@/components/DepartmentSelect';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { signIn, signUp } = useAuth();
  const { recordFailedAttempt, isAccountLocked, getRemainingLockTime } = useSecurityMonitoring();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setValidationErrors([]);

    // Sanitize inputs
    const cleanEmail = sanitizeInput(email).toLowerCase();
    const cleanPassword = sanitizeInput(password);

    // Check if account is locked
    if (isAccountLocked(cleanEmail)) {
      const remainingTime = getRemainingLockTime(cleanEmail);
      const minutes = Math.ceil(remainingTime / (60 * 1000));
      setError(`Account temporarily locked due to too many failed attempts. Try again in ${minutes} minutes.`);
      setLoading(false);
      return;
    }

    // Validate inputs
    const emailValidation = validateEmail(cleanEmail);
    const passwordValidation = validatePassword(cleanPassword);
    
    const allErrors = [...emailValidation.errors, ...passwordValidation.errors];
    if (allErrors.length > 0) {
      setValidationErrors(allErrors);
      setLoading(false);
      return;
    }

    const { error } = await signIn(cleanEmail, cleanPassword);
    
    if (error) {
      recordFailedAttempt(cleanEmail);
      
      if (error.message.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please check your credentials.');
      } else if (error.message.includes('Email not confirmed')) {
        setError('Please check your email and click the confirmation link before signing in.');
      } else if (error.message.includes('Too many requests')) {
        setError('Too many login attempts. Please wait a moment before trying again.');
      } else {
        setError('Sign in failed. Please try again.');
      }
    } else {
      // Clear any stored failed attempts on successful login
      localStorage.removeItem('security_attempts');
      navigate('/');
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setValidationErrors([]);

    // Sanitize inputs
    const cleanEmail = sanitizeInput(email).toLowerCase();
    const cleanPassword = sanitizeInput(password);
    const cleanFullName = sanitizeInput(fullName);

    // Validate inputs
    const emailValidation = validateEmail(cleanEmail);
    const passwordValidation = validatePassword(cleanPassword);
    const nameValidation = validateName(cleanFullName);
    
    // Validate password confirmation
    if (cleanPassword !== sanitizeInput(confirmPassword)) {
      allErrors.push('Passwords do not match');
    }

    const allErrors = [
      ...emailValidation.errors, 
      ...passwordValidation.errors, 
      ...nameValidation.errors
    ];

    // Validate department selection
    if (!departmentId) {
      allErrors.push('Please select your department');
    }
    
    if (allErrors.length > 0) {
      setValidationErrors(allErrors);
      setLoading(false);
      return;
    }

    const { error } = await signUp(cleanEmail, cleanPassword, cleanFullName, departmentId);
    
    if (error) {
      if (error.message.includes('User already registered')) {
        setError('An account with this email already exists. Please sign in instead.');
      } else if (error.message.includes('Password should be at least')) {
        setError('Password does not meet the minimum requirements.');
      } else if (error.message.includes('Signup is disabled')) {
        setError('New account registration is currently disabled. Please contact your administrator.');
      } else {
        setError('Sign up failed. Please try again.');
      }
    } else {
      setError('');
      setValidationErrors([]);
      // Show success message instead of immediately navigating
      setError('Account created successfully! Please check your email for a confirmation link.');
    }
    
    setLoading(false);
  };

  const formatLockoutTime = (milliseconds: number): string => {
    const minutes = Math.ceil(milliseconds / (60 * 1000));
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  const isCurrentAccountLocked = isAccountLocked(email.toLowerCase());
  const lockoutTime = getRemainingLockTime(email.toLowerCase());

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-blue-600 mr-2" />
            <h1 className="text-3xl font-bold text-blue-900">ProcureTrack</h1>
          </div>
          <p className="mt-2 text-sm text-gray-600">Government Procurement Management System</p>
          <div className="mt-2 flex items-center justify-center text-xs text-gray-500">
            <Shield className="h-3 w-3 mr-1" />
            <span>Secured with advanced authentication</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            {isCurrentAccountLocked && (
              <Alert variant="destructive" className="mb-4">
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Account temporarily locked due to multiple failed login attempts. 
                  Please wait {formatLockoutTime(lockoutTime)} before trying again.
                </AlertDescription>
              </Alert>
            )}
            
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="Enter your email"
                      disabled={isCurrentAccountLocked}
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter your password"
                      disabled={isCurrentAccountLocked}
                      autoComplete="current-password"
                    />
                  </div>
                  {validationErrors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        <ul className="list-disc list-inside space-y-1">
                          {validationErrors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                  {error && !validationErrors.length && (
                    <Alert variant={error.includes('successfully') ? 'default' : 'destructive'}>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading || isCurrentAccountLocked}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="Enter your full name"
                      autoComplete="name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signupEmail">Email</Label>
                    <Input
                      id="signupEmail"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="Enter your email"
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signupPassword">Password</Label>
                    <Input
                      id="signupPassword"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Create a strong password"
                      autoComplete="new-password"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Password must contain at least 8 characters with uppercase, lowercase, number, and special character.
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                    />
                  </div>
                   <DepartmentSelect
                    value={departmentId}
                    onValueChange={setDepartmentId}
                    required
                  />
                  {validationErrors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        <ul className="list-disc list-inside space-y-1">
                          {validationErrors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                  {error && !validationErrors.length && (
                    <Alert variant={error.includes('successfully') ? 'default' : 'destructive'}>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign Up
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
