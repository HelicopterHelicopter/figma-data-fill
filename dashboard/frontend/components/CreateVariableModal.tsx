"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";

interface CreateVariableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (variable: {
    name: string;
    category: string;
    data: string[];
    description?: string;
  }) => void;
  categories?: string[];
}

export default function CreateVariableModal({
  isOpen,
  onClose,
  onSubmit,
  categories = [],
}: CreateVariableModalProps) {
  const [variableName, setVariableName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [mockData, setMockData] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    data?: string;
  }>({});

  const validateForm = () => {
    const newErrors: { name?: string; data?: string } = {};

    // Variable name validation
    if (!variableName.trim()) {
      newErrors.name = "Variable name is required";
    } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(variableName)) {
      newErrors.name =
        "Must use snake_case format and start with letter or underscore";
    }

    // Mock data validation
    if (!mockData.trim()) {
      newErrors.data = "Mock data is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // Parse mock data - split by lines and filter empty lines
      const dataEntries = mockData
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      onSubmit({
        name: variableName.toLowerCase(),
        category: category || "Other",
        data: dataEntries,
        description: description || `Mock data for ${variableName}`,
      });

      // Reset form
      setVariableName("");
      setCategory("");
      setDescription("");
      setMockData("");
      setErrors({});
      onClose();
    }
  };

  const handleCancel = () => {
    setVariableName("");
    setCategory("");
    setDescription("");
    setMockData("");
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-semibold">
            Create New Variable
          </DialogTitle>
          <p className="text-gray-600 text-sm">
            Create a new data variable for your Figma plugin.
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Variable Name Field */}
          <div className="space-y-2">
            <Label htmlFor="variable-name" className="text-base font-medium">
              Variable Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="variable-name"
              placeholder="e.g., user_name, product_price"
              value={variableName}
              onChange={(e) => setVariableName(e.target.value)}
              className={errors.name ? "border-red-500" : ""}
            />
            <p className="text-sm text-gray-500">
              Use snake_case format. Must start with letter or underscore.
            </p>
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Category Field */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-base font-medium">
              Category
            </Label>
            <Input
              id="category"
              placeholder="e.g., User Data, Transactional, System"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <p className="text-sm text-gray-500">
              Optional. Helps organize and filter variables.
            </p>
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-medium">
              Description
            </Label>
            <Input
              id="description"
              placeholder="e.g., User names for testing purposes"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <p className="text-sm text-gray-500">
              Optional. Brief description of what this variable represents.
            </p>
          </div>

          {/* Mock Data Field */}
          <div className="space-y-2">
            <Label htmlFor="mock-data" className="text-base font-medium">
              Mock Data
            </Label>
            <Textarea
              id="mock-data"
              placeholder="Enter mock data (one value per line or JSON format) Example: John Doe&#10;Jane Smith&#10;Alex Johnson"
              value={mockData}
              onChange={(e) => setMockData(e.target.value)}
              className={`min-h-[200px] resize-none ${
                errors.data ? "border-red-500" : ""
              }`}
            />
            <p className="text-sm text-gray-500">
              Enter one value per line, or paste JSON data. This will be parsed
              automatically.
            </p>
            {errors.data && (
              <p className="text-sm text-red-500">{errors.data}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-black hover:bg-gray-800 text-white"
          >
            Create Variable
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
