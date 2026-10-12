// The message under a form field. Pair it with `fieldProps` from lib/useFieldErrors, which
// points the input's aria-describedby at `${id}-error`.

interface FieldErrorProps {
  id: string;
  message?: string;
}

export function FieldError({ id, message }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p className="field-error" id={`${id}-error`}>
      {message}
    </p>
  );
}
