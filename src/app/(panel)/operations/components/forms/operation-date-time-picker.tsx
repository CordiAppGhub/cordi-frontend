"use client";

import { registerLocale } from "react-datepicker";
import DatePicker from "react-datepicker";
import { es } from "date-fns/locale/es";
import { CalendarDays } from "lucide-react";
import styles from "./operation-date-time-picker.module.css";

registerLocale("es", es);

interface OperationDateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
}

function formatLocalDateTime(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function OperationDateTimePicker({
  value,
  onChange,
}: OperationDateTimePickerProps) {
  const parsedValue = value ? new Date(value) : null;
  const selectedDate =
    parsedValue && !Number.isNaN(parsedValue.getTime()) ? parsedValue : null;

  return (
    <div className={styles.dateTimeField}>
      <CalendarDays className={styles.calendarIcon} aria-hidden="true" />
      <DatePicker
        selected={selectedDate}
        onChange={(date: Date | null) =>
          onChange(date ? formatLocalDateTime(date) : "")
        }
        withPortal
        showTimeSelect
        timeIntervals={15}
        timeCaption="Hora"
        dateFormat="dd/MM/yyyy, h:mm aa"
        locale="es"
        calendarStartDay={1}
        isClearable
        placeholderText="Selecciona fecha y hora"
        className={styles.input}
        calendarClassName={styles.calendar}
        showPopperArrow={false}
      />
    </div>
  );
}
