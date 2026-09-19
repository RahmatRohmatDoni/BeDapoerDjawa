import React from "react";
import {
  FieldErrors,
  FieldValues,
  Path,
  UseFormRegister,
} from "react-hook-form";

type FormFieldProps<T extends FieldValues> = {
  label: React.ReactNode;
  name: Path<T>;
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  isTextArea?: boolean;
};

export default function FormField<T extends FieldValues>({
  label,
  name,
  register,
  errors,
  type = "text",
  placeholder,
  maxLength,
  isTextArea,
}: FormFieldProps<T>) {
  const error = errors[name];
  const errorMsg =
    error && typeof error === "object" && "message" in error
      ? error.message
      : undefined;

  const baseClass = `w-full px-4 py-2.5 border rounded-lg focus:ring-1 focus:ring-black transition-all ${
    errorMsg ? "border-red-500" : "border-gray-300"
  }`;

  return (
    <div>
      <label className="block text-sm font-semibold mb-1.5">
        {label}
      </label>

      {isTextArea ? (
        <textarea
          {...register(name)}
          rows={3}
          placeholder={placeholder}
          className={`${baseClass} resize-none`}
        />
      ) : (
        <input
          {...register(name)}
          type={type}
          maxLength={maxLength}
          placeholder={placeholder}
          className={baseClass}
        />
      )}

      {typeof errorMsg === "string" && (
        <p className="text-red-500 text-xs mt-1.5 font-medium">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
