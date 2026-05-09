type FormErrorProps = {
  message?: string;
  id?: string;
};

export default function FormError({ message, id }: FormErrorProps) {
  if (!message) return null;

  return (
    <p id={id} role="alert" className="text-sm text-red-700">
      {message}
    </p>
  );
}
