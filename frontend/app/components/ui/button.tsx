"use client"

import React from "react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline"
}

export function Button({
  children,
  variant = "default",
  className = "",
  ...props
}: ButtonProps) {

  const base =
    "px-4 py-2 rounded-lg font-semibold transition-all"

  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-600 text-white hover:bg-gray-800"
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}