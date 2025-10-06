"use client";
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Form = () => {
  const handleSubmit = (formData: FormData) => {
    const file = formData.get("file") as File;
    console.log(file);
    console.log(file.name);
    console.log(file.type);
    console.log(file.size);

    //read the file
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = (e) => {
      console.log(e.target?.result);
    };
    reader.onerror = (e) => {
      console.log(e);
    };
  };
  return (
    <div>
      <form action={handleSubmit} className="flex flex-col gap-4">
        <Label>Upload File</Label>
        <Input type="file" name="file" accept="text/plain" />
        <Button type="submit">Submit</Button>
      </form>
    </div>
  );
};

export default Form;
