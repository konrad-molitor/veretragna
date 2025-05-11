import React, { useState, useEffect } from 'react';
import { Input, Select, SelectItem } from '@heroui/react';

interface Department {
  code: string;
  name: string;
}

const DEPARTMENTS: Department[] = [
  { code: 'G', name: 'Artigas' },
  { code: 'A', name: 'Canelones' },
  { code: 'E', name: 'Cerro Largo' },
  { code: 'L', name: 'Colonia' },
  { code: 'Q', name: 'Durazno' },
  { code: 'N', name: 'Flores' },
  { code: 'O', name: 'Florida' },
  { code: 'P', name: 'Lavalleja' },
  { code: 'B', name: 'Maldonado' },
  { code: 'S', name: 'Montevideo' },
  { code: 'I', name: 'Paysandú' },
  { code: 'J', name: 'Río Negro' },
  { code: 'F', name: 'Rivera' },
  { code: 'C', name: 'Rocha' },
  { code: 'H', name: 'Salto' },
  { code: 'M', name: 'San José' },
  { code: 'K', name: 'Soriano' },
  { code: 'R', name: 'Tacuarembó' },
  { code: 'D', name: 'Treinta y Tres' },
];

interface BusLicensePlateInputProps {
  value: string;
  onChange: (formattedValue: string) => void;
}

export function BusLicensePlateInput({ value, onChange }: BusLicensePlateInputProps) {
  const [fullLicensePlate, setFullLicensePlate] = useState(value);
  const [selectedDepartment, setSelectedDepartment] = useState('');

  const extractAndSetDepartmentCode = (input: string): void => {
    if (input && input.length > 0) {
      const deptCode = input.charAt(0).toUpperCase();
      if (DEPARTMENTS.some((dept) => dept.code === deptCode)) {
        setSelectedDepartment(deptCode);
      }
    } else {
      setSelectedDepartment('');
    }
  };

  useEffect(() => {
    setFullLicensePlate(value);
    extractAndSetDepartmentCode(value);
  }, [value]);

  const formatLicensePlate = (inputValue: string): string => {
    const cleanValue = inputValue.replace(/\s+/g, '').toUpperCase();

    if (cleanValue.length >= 1) {
      const departmentCode = cleanValue.charAt(0).toUpperCase();
      let tuPart = '';
      let numericPart = '';

      const tuIndex = cleanValue.substring(1).indexOf('TU');

      if (tuIndex !== -1) {
        tuPart = 'TU';
        numericPart = cleanValue.substring(tuIndex + 3).replace(/[^0-9]/g, '').substring(0, 4);
      } else {
        const hasT = cleanValue.length >= 2 && cleanValue.charAt(1).toUpperCase() === 'T';
        const hasU = cleanValue.length >= 3 && cleanValue.charAt(2).toUpperCase() === 'U';

        if (hasT && hasU) {
          tuPart = 'TU';
          numericPart = cleanValue.substring(3).replace(/[^0-9]/g, '').substring(0, 4);
        } else {
          numericPart = cleanValue.substring(1).replace(/[^0-9]/g, '').substring(0, 4);
          tuPart = 'TU';
        }
      }

      return `${departmentCode} ${tuPart} ${numericPart}`;
    }

    return inputValue;
  };

  const handleFullLicensePlateChange = (inputValue: string) => {
    setFullLicensePlate(inputValue);

    extractAndSetDepartmentCode(inputValue);

    const formattedValue = formatLicensePlate(inputValue);
    onChange(formattedValue);
  };

  const handleDepartmentChange = (code: string) => {
    setSelectedDepartment(code);

    let newLicensePlate = fullLicensePlate;
    if (newLicensePlate.length > 0) {
      newLicensePlate = code + newLicensePlate.substring(1);
    } else {
      newLicensePlate = `${code}TU `;
    }

    setFullLicensePlate(newLicensePlate);
    onChange(formatLicensePlate(newLicensePlate));
  };

  const getDisplayFormattedLicensePlate = (inputValue: string): string => {
    const parts = inputValue.split(' ');
    if (parts.length >= 3 && parts[1] === 'TU') {
      const deptCode = parts[0];
      const numericPart = parts[2].padStart(4, '0');
      return `${deptCode} TU ${numericPart}`;
    }
    return inputValue;
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-medium">Matrícula</div>
      <div className="flex gap-2">
        <Select
          className="w-1/3"
          placeholder="Departamento"
          value={selectedDepartment}
          onChange={(e) => handleDepartmentChange(e.target.value)}
          selectedKeys={selectedDepartment ? [selectedDepartment] : []}
          renderValue={(items) => {
            const selectedDept = DEPARTMENTS.find((dept) => dept.code === selectedDepartment);
            if (!selectedDept) return null;

            return (
              <div className="flex items-center gap-1">
                <span>{selectedDept.name}</span>
                <span className="text-sm text-gray-500">
                  (
                  {selectedDept.code}
                  )
                </span>
              </div>
            );
          }}
        >
          {DEPARTMENTS.map((dept) => (
            <SelectItem key={dept.code}>
              <div className="flex justify-between w-full">
                <span>{dept.name}</span>
                <span className="text-gray-500">
                  {dept.code}
                </span>
              </div>
            </SelectItem>
          ))}
        </Select>

        <Input
          className="w-2/3"
          placeholder="X TU 1234"
          value={fullLicensePlate}
          onChange={(e) => handleFullLicensePlateChange(e.target.value)}
          aria-label="Número de matrícula"
        />
      </div>

      {fullLicensePlate && (
        <div className="mt-1 p-2 bg-gray-100 rounded text-center">
          <span className="font-mono text-lg font-bold">{getDisplayFormattedLicensePlate(formatLicensePlate(fullLicensePlate))}</span>
        </div>
      )}

      <div className="text-xs text-gray-500 mt-1">
        Formato: X TU 1234 (X - código de departamento, 1234 - número de 4 dígitos)
      </div>
    </div>
  );
}
