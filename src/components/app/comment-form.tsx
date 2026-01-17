"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const DEFAULT_PLACEHOLDER = "Add your comment";

type CommentFormProps = {
  onSubmit: (body: string) => void;
  placeholder?: string;
  buttonLabel?: string;
};

export default function CommentForm({
  onSubmit,
  placeholder = DEFAULT_PLACEHOLDER,
  buttonLabel = "Post",
}: CommentFormProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
      />
      <Button type="submit">{buttonLabel}</Button>
    </form>
  );
}
