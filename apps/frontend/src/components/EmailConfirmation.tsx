import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Input,
  Progress,
  Card,
  CardBody,
  CardHeader,
  Alert,
} from '@heroui/react';
import axios from 'axios';

export function EmailConfirmation(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [otpCode, setOtpCode] = useState<string>(searchParams.get('code') || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [redirectProgress, setRedirectProgress] = useState<number>(0);
  // Use ref to track if the confirmation request has been sent
  const confirmRequestSent = useRef<boolean>(false);

  const confirmRegistration = async (code: string): Promise<void> => {
    // Skip if already processing or if request was already sent
    if (isLoading || confirmRequestSent.current) return;

    setIsLoading(true);
    setError('');
    confirmRequestSent.current = true;

    try {
      const response = await axios.get(`/api/users/confirm?code=${code}`);

      // Store user data and token in localStorage (same as in login)
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      setIsSuccess(true);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error || 'Error al confirmar el registro.');
      } else {
        setError('Error de conexión. Por favor, inténtelo de nuevo más tarde.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // If code is in URL, send confirmation request
    if (searchParams.get('code') && !confirmRequestSent.current) {
      confirmRegistration(searchParams.get('code') || '');
    }
  }, [searchParams]);

  useEffect(() => {
    // Start countdown when confirmation is successful
    if (isSuccess) {
      const redirectTime = 5000; // 5 seconds
      const interval = 50; // Interval for smooth animation
      let progress = 0;

      const timer = setInterval(() => {
        progress += (interval / redirectTime) * 100;
        setRedirectProgress(Math.min(progress, 100));

        if (progress >= 100) {
          clearInterval(timer);
          navigate('/dashboard');
        }
      }, interval);

      return () => clearInterval(timer);
    }
    return undefined;
  }, [isSuccess, navigate]);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setError('Por favor, introduzca el código de confirmación');
      return;
    }
    confirmRegistration(otpCode);
  };

  // Form component to avoid duplication
  const confirmationForm = (
    <form onSubmit={handleSubmit}>
      <p className="mb-4 text-gray-600">
        Por favor, introduzca el código de confirmación que fue
        enviado a su correo electrónico.
      </p>
      <Input
        label="Código de confirmación"
        value={otpCode}
        onChange={(e) => setOtpCode(e.target.value)}
        variant="bordered"
        size="lg"
        radius="sm"
        className="mb-4"
        autoFocus
      />
      <Button
        type="submit"
        variant="solid"
        size="lg"
        className="w-full bg-red-600 hover:bg-red-700 text-white"
        disabled={isLoading}
      >
        {isLoading ? 'Confirmando...' : 'Confirmar registro'}
      </Button>
    </form>
  );

  // Render content based on state
  let content;
  if (isSuccess) {
    content = (
      <div className="text-center">
        <div className="mb-4 text-green-600 font-semibold text-lg">
          ¡Su registro ha sido confirmado con éxito!
        </div>
        <p className="mb-6 text-gray-600">
          Será redirigido al panel de control en
          {5 - Math.floor((redirectProgress / 100) * 5)}
          segundos...
        </p>
        <Progress
          value={redirectProgress}
          color="success"
          showValueLabel={false}
          className="mb-4"
        />
        <Button
          onClick={() => navigate('/dashboard')}
          variant="solid"
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          Ir ahora
        </Button>
      </div>
    );
  } else if (error) {
    content = (
      <div>
        <Alert className="mb-4" variant="solid" color="danger">
          {error}
        </Alert>
        {!searchParams.get('code') && confirmationForm}
      </div>
    );
  } else if (searchParams.get('code')) {
    content = (
      <div className="text-center p-4">
        <div className="animate-spin h-8 w-8 border-4 border-red-600 rounded-full border-t-transparent mx-auto mb-4" />
        <p>Confirmando registro...</p>
      </div>
    );
  } else {
    content = confirmationForm;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex gap-3">
          <img
            src="/assets/images/logo.png"
            alt="Veretragna"
            className="h-10 w-auto"
          />
          <div className="flex flex-col">
            <h1 className="text-xl font-bold">Veretragna</h1>
            <p className="text-small text-default-500">Confirmación de Registro</p>
          </div>
        </CardHeader>
        <CardBody>
          {content}
        </CardBody>
      </Card>
    </div>
  );
}

export default EmailConfirmation;
