import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Input } from '@heroui/react';
import axios from 'axios';

type AuthFormProps = {
  onClose: () => void;
  visible: boolean;
};

export function AuthForm({ onClose, visible }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setIsForgotPassword(false);
    setError('');
    setSuccessMessage('');
  };

  const toggleForgotPassword = () => {
    setIsForgotPassword(!isForgotPassword);
    setError('');
    setSuccessMessage('');
  };

  const validateForm = () => {
    if (!formData.email) return 'El correo electrónico es obligatorio';

    if (!isForgotPassword && !formData.password) return 'La contraseña es obligatoria';

    if (!isLogin && !isForgotPassword) {
      if (!formData.firstName) return 'El nombre es obligatorio';
      if (!formData.lastName) return 'El apellido es obligatorio';

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!passwordRegex.test(formData.password)) {
        return 'La contraseña debe tener al menos 8 caracteres, incluyendo al menos una letra mayúscula, una minúscula y un número';
      }
    }

    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (isForgotPassword) {
        // Forgot password request
        await axios.post('/api/users/forgot-password', {
          email: formData.email,
        });

        setSuccessMessage('Si existe una cuenta con ese correo electrónico, recibirás un enlace para restablecer tu contraseña.');
      } else if (isLogin) {
        // Login request
        const response = await axios.post('/api/users/login', {
          email: formData.email,
          password: formData.password,
        });

        // Store token in localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Redirect or update UI as needed
        window.location.href = '/dashboard'; // or use React Router navigation
      } else {
        // Signup request
        const response = await axios.post('/api/users', {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
        });

        // Switch to login form with success message
        setIsLogin(true);
        setError(''); // Clear any existing errors
        setSuccessMessage('Registro exitoso. Por favor revisa tu correo electrónico para confirmar tu cuenta.');
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error || 'Ocurrió un error. Inténtalo de nuevo.');
      } else {
        setError('Error de conexión. Por favor, inténtalo más tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderForgotPasswordForm = () => (
    <>
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Recuperar Contraseña
      </h2>

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-md text-sm">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full">
        <div className="space-y-4">
          <Input
            label="Correo Electrónico"
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            variant="bordered"
            size="lg"
            radius="sm"
            required
          />
        </div>

        <div className="mt-6">
          <Button
            type="submit"
            variant="solid"
            size="lg"
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-md"
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
          </Button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={toggleForgotPassword}
          className="text-sm font-medium text-red-600 hover:text-red-800 hover:underline"
        >
          Volver a Iniciar Sesión
        </button>
      </div>
    </>
  );

  const renderLoginRegisterForm = () => (
    <>
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
      </h2>

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-md text-sm">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full">
        <div className="space-y-4">
          <Input
            label="Correo Electrónico"
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            variant="bordered"
            size="lg"
            radius="sm"
            required
          />

          {!isLogin && (
            <>
              <Input
                label="Nombre"
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                variant="bordered"
                size="lg"
                radius="sm"
                required
              />

              <Input
                label="Apellido"
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                variant="bordered"
                size="lg"
                radius="sm"
                required
              />
            </>
          )}

          <Input
            label="Contraseña"
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            variant="bordered"
            size="lg"
            radius="sm"
            required
          />
        </div>

        {isLogin && (
          <div className="mt-2 text-right">
            <button
              type="button"
              onClick={toggleForgotPassword}
              className="text-sm font-medium text-red-600 hover:text-red-800 hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        )}

        <div className="mt-6">
          <Button
            type="submit"
            variant="solid"
            size="lg"
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-md"
            disabled={loading}
          >
            {loading
              ? 'Cargando...'
              : isLogin
                ? 'Iniciar Sesión'
                : 'Registrarse'}
          </Button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={toggleForm}
          className="text-sm font-medium text-red-600 hover:text-red-800 hover:underline"
        >
          {isLogin
            ? '¿No tienes una cuenta? Regístrate'
            : '¿Ya tienes una cuenta? Inicia sesión'}
        </button>
      </div>
    </>
  );

  return (
    <motion.div
      className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg"
      initial={{ y: 50, opacity: 0 }}
      animate={{
        y: visible ? 0 : 50,
        opacity: visible ? 1 : 0,
      }}
      transition={{ duration: 0.5 }}
    >
      {isForgotPassword ? renderForgotPasswordForm() : renderLoginRegisterForm()}

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-medium text-gray-500 hover:text-gray-700 hover:underline"
        >
          Volver
        </button>
      </div>
    </motion.div>
  );
}

export default AuthForm;
