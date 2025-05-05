import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Divider,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../app/utils/axiosInstance';

// Ticket interface
interface Ticket {
  id: string;
  tripId: string;
  userId: string;
  price: number;
  validationCode: string;
  status: 'paid' | 'boarded' | 'cancelled' | 'refunded';
  bookingDatetime: string;
  trip: {
    departureDateTime: string;
    arrivalDateTime: string;
  };
  startRouteStop: {
    location: {
      name: string;
    };
  };
  endRouteStop: {
    location: {
      name: string;
    };
  };
}

export function UserTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserTickets = async () => {
      try {
        const response = await axiosInstance.get('/tickets/user/me');
        setTickets(response.data);
      } catch (error) {
        console.error('Error loading tickets:', error);
        toast.error('Error loading tickets');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserTickets();
  }, []);

  // Function for date formatting
  const formatDate = (dateString: string) => {
    if (!dateString) {
      return '';
    }

    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Get ticket status in Spanish
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Pagado';
      case 'boarded': return 'Abordado';
      case 'cancelled': return 'Cancelado';
      case 'refunded': return 'Reembolsado';
      default: return status;
    }
  };

  // Get color for status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'boarded': return 'primary';
      case 'cancelled': return 'danger';
      case 'refunded': return 'warning';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center my-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader className="pb-0 pt-4 px-4 flex-col items-start">
          <h2 className="text-xl font-bold">Mis Boletos</h2>
        </CardHeader>
        <Divider />
        <CardBody className="py-6 px-4">
          <p className="text-center text-gray-600">No tienes boletos disponibles.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader className="pb-0 pt-4 px-4 flex-col items-start">
        <h2 className="text-xl font-bold">Mis Boletos</h2>
      </CardHeader>
      <Divider />
      <CardBody className="overflow-auto">
        <Table aria-label="Tabla de boletos">
          <TableHeader>
            <TableColumn>VIAJE</TableColumn>
            <TableColumn>
              PARADAS
            </TableColumn>
            <TableColumn>FECHA</TableColumn>
            <TableColumn>CÓDIGO</TableColumn>
            <TableColumn>PRECIO</TableColumn>
            <TableColumn>ESTADO</TableColumn>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell>
                  {formatDate(ticket.trip.departureDateTime)}
                  {' '}
                  -
                  {' '}
                  {formatDate(ticket.trip.arrivalDateTime)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{ticket.startRouteStop?.location?.name}</span>
                    <span className="text-gray-500 text-xs">—</span>
                    <span>{ticket.endRouteStop?.location?.name}</span>
                  </div>
                </TableCell>
                <TableCell>{formatDate(ticket.bookingDatetime)}</TableCell>
                <TableCell>
                  <span className="font-mono font-medium">{ticket.validationCode}</span>
                </TableCell>
                <TableCell>
                  $
                  {ticket.price}
                </TableCell>
                <TableCell>
                  <Chip
                    color={getStatusColor(ticket.status) as any}
                    size="sm"
                    variant="flat"
                  >
                    {getStatusLabel(ticket.status)}
                  </Chip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  );
}

export default UserTickets;
