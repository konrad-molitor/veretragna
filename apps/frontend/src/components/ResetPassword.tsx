import React, { useState, useEffect } from 'react';
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

export function ResetPassword(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    passwordResetCode: searchParams.get('code') || '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [redirectProgress, setRedirectProgress] = useState<number>(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.passwordResetCode) {
      return 'El código de restablecimiento es obligatorio';
    }

    if (!formData.newPassword) {
      return 'La nueva contraseña es obligatoria';
    }

    if (formData.newPassword !== formData.confirmPassword) {
      return 'Las contraseñas no coinciden';
    }

    // Password complexity validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(formData.newPassword)) {
      return 'La contraseña debe tener al menos 8 caracteres, incluyendo al menos una letra mayúscula, una minúscula y un número';
    }

    return '';
  };

  const resetPassword = async (): Promise<void> => {
    // Skip if already processing
    if (isLoading) return;

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await axios.post('/api/users/reset-password', {
        passwordResetCode: formData.passwordResetCode,
        newPassword: formData.newPassword,
      });

      setIsSuccess(true);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error || 'Error al restablecer la contraseña.');
      } else {
        setError('Error de conexión. Por favor, inténtelo de nuevo más tarde.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Start countdown when reset is successful
    if (isSuccess) {
      const redirectTime = 5000; // 5 seconds
      const interval = 50; // Interval for smooth animation
      let progress = 0;

      const timer = setInterval(() => {
        progress += (interval / redirectTime) * 100;
        setRedirectProgress(Math.min(progress, 100));

        if (progress >= 100) {
          clearInterval(timer);
          navigate('/');
        }
      }, interval);

      return () => clearInterval(timer);
    }
    return undefined;
  }, [isSuccess, navigate]);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    resetPassword();
  };

  // Form component to avoid duplication
  const resetForm = (
    <form onSubmit={handleSubmit}>
      <p className="mb-4 text-gray-600">
        Por favor, introduce el código de restablecimiento que fue
        enviado a tu correo electrónico y crea una nueva contraseña.
      </p>
      <Input
        label="Código de restablecimiento"
        name="passwordResetCode"
        value={formData.passwordResetCode}
        onChange={handleChange}
        variant="bordered"
        size="lg"
        radius="sm"
        className="mb-4"
        autoFocus={!formData.passwordResetCode}
      />
      <Input
        label="Nueva contraseña"
        name="newPassword"
        type="password"
        value={formData.newPassword}
        onChange={handleChange}
        variant="bordered"
        size="lg"
        radius="sm"
        className="mb-4"
      />
      <Input
        label="Confirmar nueva contraseña"
        name="confirmPassword"
        type="password"
        value={formData.confirmPassword}
        onChange={handleChange}
        variant="bordered"
        size="lg"
        radius="sm"
        className="mb-4"
      />
      <Button
        type="submit"
        variant="solid"
        size="lg"
        className="w-full bg-red-600 hover:bg-red-700 text-white"
        disabled={isLoading}
      >
        {isLoading ? 'Procesando...' : 'Restablecer contraseña'}
      </Button>
    </form>
  );

  // Render content based on state
  let content;
  if (isSuccess) {
    content = (
      <div className="text-center">
        <div className="mb-4 text-green-600 font-semibold text-lg">
          ¡Tu contraseña ha sido restablecida con éxito!
        </div>
        <p className="mb-6 text-gray-600">
          Serás redirigido a la página de inicio en
          {' '}
          {5 - Math.floor((redirectProgress / 100) * 5)}
          {' '}
          segundos...
        </p>
        <Progress
          value={redirectProgress}
          color="success"
          showValueLabel={false}
          className="mb-4"
        />
        <Button
          onClick={() => navigate('/')}
          variant="solid"
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          Ir ahora
        </Button>
      </div>
    );
  } else {
    content = (
      <div>
        {error && (
          <Alert className="mb-4" variant="solid" color="danger">
            {error}
          </Alert>
        )}
        {resetForm}
      </div>
    );
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
            <p className="text-small text-default-500">Restablecimiento de Contraseña</p>
          </div>
        </CardHeader>
        <CardBody>
          {content}
        </CardBody>
      </Card>
    </div>
  );
}

export default ResetPassword; 