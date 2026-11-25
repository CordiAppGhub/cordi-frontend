"use client";

import type { KeyboardEvent } from "react";
import styles from "../operation-workflow.module.css";

interface WorkflowStepCardProps {
  label: string;
  isCompleted: boolean;
  isActive: boolean;
  isRejected: boolean;
  isDisabled: boolean;
  isBlockedByOtherOperation: boolean;
  isStatusOnlyBlocker: boolean;
  missingRequirements: string[];
  instruction?: string;
  rejectedNote?: string;
  onClick: () => void;
  onStatusClick: () => void;
  onKeyDownStatus: (event: KeyboardEvent<HTMLDivElement>) => void;
}

export function WorkflowStepCard({
  label,
  isCompleted,
  isActive,
  isRejected,
  isDisabled,
  isBlockedByOtherOperation,
  isStatusOnlyBlocker,
  missingRequirements,
  instruction,
  rejectedNote,
  onClick,
  onStatusClick,
  onKeyDownStatus,
}: WorkflowStepCardProps) {
  const buttonClass = `${styles.stepBtn} ${
    isRejected
      ? styles.rejectedBtn
      : isBlockedByOtherOperation
        ? styles.lockedBtn
        : isActive
          ? styles.activeBtn
          : isCompleted
            ? styles.completedBtn
            : styles.lockedBtn
  }`;

  return (
    <div className={styles.stepWrapper}>
      <button
        className={buttonClass}
        disabled={isDisabled && !isStatusOnlyBlocker}
        aria-disabled={isStatusOnlyBlocker || undefined}
        onClick={onClick}
      >
        <span className={styles.stepIcon}>
          {isRejected ? "⚠️" : isCompleted ? "✅" : isActive ? "▶" : "🔒"}
        </span>
        {label}
      </button>
      {isActive && instruction && (
        <p className={styles.stepInstruction} role="status">
          {instruction}
        </p>
      )}
      {missingRequirements.length > 0 && (
        <div
          className={`${styles.startBlockedNotice} ${
            isStatusOnlyBlocker ? styles.startBlockedNoticeInteractive : ""
          }`}
          role={isStatusOnlyBlocker ? "button" : "status"}
          tabIndex={isStatusOnlyBlocker ? 0 : undefined}
          onClick={isStatusOnlyBlocker ? onStatusClick : undefined}
          onKeyDown={isStatusOnlyBlocker ? onKeyDownStatus : undefined}
        >
          <strong>Para continuar falta:</strong>
          <ul>
            {missingRequirements.map((requirement) => (
              <li key={requirement}>{requirement}</li>
            ))}
          </ul>
          {isStatusOnlyBlocker && (
            <span>Toca aquí para subir y cambiar el estado ↑</span>
          )}
        </div>
      )}
      {isRejected && (
        <p role="alert" className={styles.rejectedNotice}>
          <strong>Soporte devuelto:</strong>{" "}
          {rejectedNote || "La evidencia no es válida, vuelve a subirla."}
        </p>
      )}
    </div>
  );
}
