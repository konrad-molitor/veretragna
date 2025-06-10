import React, { useEffect, useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  Input,
  Divider,
  Alert,
  Textarea,
} from '@heroui/react';
import { CreditCardIcon } from '@heroicons/react/24/outline';

interface SimpleCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripName: string;
  price: number;
  onPaymentComplete: () => void;
}

interface CardFormState {
  cardNumber: string;
  cardName: string;
  expireDate: string;
  cvv: string;
  billingAddress: string;
}

export function SimpleCheckoutModal({
  isOpen,
  onClose,
  tripName,
  price,
  onPaymentComplete,
}: SimpleCheckoutModalProps) {
  const [formData, setFormData] = useState<CardFormState>({
    cardNumber: '',
    cardName: '',
    expireDate: '',
    cvv: '',
    billingAddress: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        cardNumber: '',
        cardName: '',
        expireDate: '',
        cvv: '',
        billingAddress: '',
      });
      setIsProcessing(false);
      setShowSuccess(false);
      setError(null);
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Card number formatting (adding spaces every 4 digits)
    if (name === 'cardNumber') {
      const formatted = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      setFormData({
        ...formData,
        [name]: formatted.substring(0, 19), // Limit to 16 digits + 3 spaces
      });
    }
    // Expiration date formatting (MM/YY)
    else if (name === 'expireDate') {
      const cleaned = value.replace(/\D/g, '');
      let formatted = cleaned;

      if (cleaned.length > 2) {
        formatted = `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
      }

      setFormData({
        ...formData,
        [name]: formatted.substring(0, 5), // Limit to MM/YY format
      });
    }
    // CVV formatting (digits only, max 3)
    else if (name === 'cvv') {
      const cleaned = value.replace(/\D/g, '');
      setFormData({
        ...formData,
        [name]: cleaned.substring(0, 3),
      });
    }
    // No formatting for other fields
    else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      billingAddress: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Call the payment completion callback
      await onPaymentComplete();
      setShowSuccess(true);
      
      // Auto close modal after showing success for 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: unknown) {
      console.error('Error in checkout process:', err);
      setError('Ha ocurrido un error en el proceso de pago. Por favor intente de nuevo.');
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="4xl"
      scrollBehavior="inside"
      isDismissable={!isProcessing}
      isKeyboardDismissDisabled={isProcessing}
      backdrop="blur"
    >
      <ModalContent>
        {showSuccess ? (
          // Successful payment - show confirmation
          <ModalBody className="py-10 px-4 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-green-600">¡Pago exitoso!</h2>
              <p className="text-lg text-gray-600">Su reserva ha sido confirmada correctamente.</p>
              <p className="text-sm text-gray-500">Se cerrará automáticamente en unos segundos...</p>
              <Button color="primary" size="lg" onClick={handleClose} className="mt-6">
                Cerrar ahora
              </Button>
            </div>
          </ModalBody>
        ) : (
          // Payment form
          <>
            <ModalHeader className="border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Finalizar Pago</h2>
            </ModalHeader>
            <ModalBody className="p-0">
              <Alert
                color="warning"
                className="rounded-none"
              >
                <p>
                  <strong>¡Advertencia!</strong>
                  {' '}
                  Este es un proyecto de demostración. No introduzca información real de tarjetas de crédito.
                </p>
              </Alert>

              {error && (
                <Alert
                  color="danger"
                  className="rounded-none"
                >
                  <p>
                    <strong>Error:</strong>
                    {' '}
                    {error}
                  </p>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                {/* Purchase information - left side */}
                <div className="p-6 bg-gray-50">
                  <h3 className="text-lg font-bold mb-4">Detalles de la reserva</h3>
                  <Card className="shadow-sm">
                    <CardBody className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <p className="font-medium">{tripName}</p>
                          <p className="text-sm text-gray-600">Reserva</p>
                        </div>
                        <p className="font-bold text-red-600">
                          $
                          {price.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </CardBody>
                  </Card>

                  <Divider className="my-4" />

                  <div className="flex justify-between items-center">
                    <p className="font-medium">Total:</p>
                    <p className="text-xl font-bold text-red-600">
                      $
                      {price.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Payment form - right side */}
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-4">Información de pago</h3>
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                      <Input
                        label="Número de tarjeta"
                        placeholder="1234 5678 9012 3456"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        required
                        startContent={<CreditCardIcon className="h-5 w-5 text-gray-400" />}
                        maxLength={19}
                        isDisabled={isProcessing}
                      />

                      <Input
                        label="Nombre en la tarjeta"
                        placeholder="NOMBRE APELLIDO"
                        name="cardName"
                        value={formData.cardName}
                        onChange={handleInputChange}
                        required
                        isDisabled={isProcessing}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Fecha de expiración"
                          placeholder="MM/YY"
                          name="expireDate"
                          value={formData.expireDate}
                          onChange={handleInputChange}
                          required
                          isDisabled={isProcessing}
                        />

                        <Input
                          label="Código de seguridad"
                          placeholder="123"
                          name="cvv"
                          value={formData.cvv}
                          onChange={handleInputChange}
                          required
                          type="password"
                          isDisabled={isProcessing}
                        />
                      </div>

                      <Textarea
                        label="Dirección de facturación"
                        placeholder="Ingrese su dirección completa"
                        value={formData.billingAddress}
                        onChange={handleTextareaChange}
                        isDisabled={isProcessing}
                      />
                    </div>

                    <Button
                      type="submit"
                      color="primary"
                      size="lg"
                      className="w-full mt-6"
                      style={{ backgroundColor: 'rgb(255, 0, 22)' }}
                      isLoading={isProcessing}
                      isDisabled={isProcessing}
                    >
                      {isProcessing ? 'Procesando...' : 'Pagar ahora'}
                    </Button>
                  </form>
                </div>
              </div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

export default SimpleCheckoutModal; 