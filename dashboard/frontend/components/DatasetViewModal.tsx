"use client";

import { useState, useEffect, useRef } from "react";
import { Copy, Trash2, Plus, Save } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { ScrollArea } from "./ui/scroll-area";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";

import { Dataset, apiClient } from "@/lib/api";

interface DatasetViewModalProps {
  dataset: Dataset | null;
  isOpen: boolean;
  onClose: () => void;
  onDatasetUpdated?: () => void;
}

export default function DatasetViewModal({
  dataset,
  isOpen,
  onClose,
  onDatasetUpdated,
}: DatasetViewModalProps) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [dataEntries, setDataEntries] = useState<string[]>([]);
  const [originalDataEntries, setOriginalDataEntries] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDataText, setNewDataText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const { toast } = useToast();

  // Create ref for scroll area
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Initialize data entries when dataset changes
  useEffect(() => {
    console.log("Dataset prop changed in modal:", dataset);
    if (dataset) {
      const dataArray = [...dataset.data];
      console.log("Updating modal data entries with:", dataArray);
      setDataEntries(dataArray);
      setOriginalDataEntries(dataArray);
    }
  }, [dataset]);

  // Reset form when modal closes (but not when dataset updates)
  useEffect(() => {
    if (!isOpen) {
      setShowAddForm(false);
      setNewDataText("");
      console.log("Modal closed, form reset");
    }
  }, [isOpen]);

  // Check if data has been modified
  const hasUnsavedChanges = () => {
    return JSON.stringify(dataEntries) !== JSON.stringify(originalDataEntries);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(text);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const handleDeleteEntry = (index: number) => {
    const newEntries = dataEntries.filter((_, i) => i !== index);
    setDataEntries(newEntries);
  };

  const handleAddData = () => {
    setShowAddForm(true);
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewDataText("");
  };

  const scrollToBottom = () => {
    console.log("Attempting to scroll to bottom...");
    console.log("Total dataEntries:", dataEntries.length);

    if (scrollAreaRef.current) {
      console.log("Scroll container found");

      // Method 1: Try to find and scroll the last table row
      const lastRow = scrollAreaRef.current.querySelector(
        "table tbody tr:last-child"
      );
      if (lastRow) {
        console.log("Found last row, scrolling into view");
        lastRow.scrollIntoView({ behavior: "smooth", block: "end" });
        return;
      }

      // Method 2: Direct scroll on the div
      console.log("Scroll container details:", {
        scrollTop: scrollAreaRef.current.scrollTop,
        scrollHeight: scrollAreaRef.current.scrollHeight,
        clientHeight: scrollAreaRef.current.clientHeight,
        isScrollable:
          scrollAreaRef.current.scrollHeight >
          scrollAreaRef.current.clientHeight,
      });

      if (
        scrollAreaRef.current.scrollHeight > scrollAreaRef.current.clientHeight
      ) {
        console.log("Content is scrollable, scrolling to bottom");
        scrollAreaRef.current.scrollTo({
          top: scrollAreaRef.current.scrollHeight,
          behavior: "smooth",
        });

        // Double-check the scroll worked
        setTimeout(() => {
          console.log(
            "Post-scroll scrollTop:",
            scrollAreaRef.current?.scrollTop
          );
        }, 500);
      } else {
        console.log("Content fits in container, no scrolling needed");
      }
    } else {
      console.log("Scroll container ref not found");
    }
  };

  const handleSubmitData = () => {
    console.log("handleSubmitData called with:", { newDataText });

    if (newDataText.trim()) {
      // Split by lines and filter out empty lines
      const newEntries = newDataText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      console.log("Adding new entries:", newEntries);
      console.log("Current dataEntries:", dataEntries);

      const updatedEntries = [...dataEntries, ...newEntries];
      setDataEntries(updatedEntries);

      console.log("Updated dataEntries:", updatedEntries);

      setNewDataText("");
      setShowAddForm(false);

      console.log("Form closed, data added locally");

      // Scroll to bottom to show new entries
      setTimeout(() => scrollToBottom(), 100);
    }
  };

  const handleSaveChanges = async () => {
    console.log("handleSaveChanges called");
    console.log("Dataset:", dataset);
    console.log("hasUnsavedChanges():", hasUnsavedChanges());
    console.log("dataEntries:", dataEntries);
    console.log("originalDataEntries:", originalDataEntries);

    if (!dataset || !hasUnsavedChanges()) {
      console.log("Early return: no dataset or no changes");
      return;
    }

    console.log("Proceeding with save...");
    setIsSaving(true);

    try {
      console.log("Calling updateDataset API with:", {
        id: dataset._id,
        data: dataEntries,
      });

      await apiClient.updateDataset(dataset._id, {
        data: dataEntries,
      });

      console.log("API call successful");

      // Update original data to reflect the saved state
      setOriginalDataEntries([...dataEntries]);

      toast({
        title: "Success!",
        description: `Dataset "${dataset.name}" updated successfully`,
      });

      // Notify parent component that dataset was updated
      onDatasetUpdated?.();
      console.log("Parent notified of dataset update");
    } catch (error) {
      console.error("Failed to update dataset:", error);

      let errorMessage = "Failed to update dataset. Please try again.";
      if (error instanceof Error && error.message.includes("401")) {
        errorMessage = "Authentication failed. Please sign in again.";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      console.log("Save operation completed");
    }
  };

  if (!dataset) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            Mock Data: {dataset.name}
            {hasUnsavedChanges() && (
              <span className="text-sm text-orange-600 font-normal">
                • Unsaved changes
              </span>
            )}
          </DialogTitle>
          <p className="text-gray-600 text-sm">
            View and manage mock data for this variable. Data Type: String
          </p>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4 min-h-0">
          {/* Data entries count and Add Data/Cancel button */}
          <div className="flex items-center justify-between">
            <p className="text-gray-600">{dataEntries.length} data entries</p>
            {!showAddForm ? (
              <Button
                onClick={handleAddData}
                className="bg-black hover:bg-gray-800 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Data
              </Button>
            ) : (
              <Button onClick={handleCancelAdd} variant="outline">
                Cancel
              </Button>
            )}
          </div>

          {/* Add New Mock Data Form */}
          {showAddForm && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-semibold mb-3">Add New Mock Data</h3>
              <div className="space-y-3">
                <Textarea
                  placeholder="Enter new mock data (one value per line or JSON format)"
                  value={newDataText}
                  onChange={(e) => setNewDataText(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmitData}
                    className="bg-gray-700 hover:bg-gray-800 text-white"
                    disabled={!newDataText.trim()}
                  >
                    Add Data
                  </Button>
                  <Button onClick={handleCancelAdd} variant="outline">
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Data table with scroll */}
          <div className="flex-1 border rounded-lg overflow-hidden flex flex-col">
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="flex-1 overflow-y-auto"
              ref={scrollAreaRef}
            >
              {/* Header row */}
              <div className="grid grid-cols-12 gap-2 p-2 bg-gray-50 border-b font-medium text-sm sticky top-0 z-10">
                <div className="col-span-1">No.</div>
                <div className="col-span-8">Value</div>
                <div className="col-span-1">Type</div>
                <div className="col-span-2 text-center">Actions</div>
              </div>

              {/* Data rows */}
              {dataEntries.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No data entries found
                </div>
              ) : (
                dataEntries.map((item, index) => (
                  <div
                    key={`item-${index}-${item.slice(0, 10)}`}
                    className="grid grid-cols-12 gap-2 p-2 border-b hover:bg-gray-50 min-h-[40px] items-center"
                  >
                    <div className="col-span-1 font-medium">{index + 1}</div>
                    <div className="col-span-8">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm break-all">
                          {item}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(item)}
                          className="h-6 w-6 p-0 opacity-60 hover:opacity-100 flex-shrink-0"
                        >
                          {copiedItem === item ? (
                            <span className="text-green-600 text-xs">✓</span>
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="col-span-1">
                      <span className="text-gray-600">string</span>
                    </div>
                    <div className="col-span-2 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEntry(index)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}

              {/* End marker */}
              {dataEntries.length > 0 && (
                <div className="p-2 text-center text-gray-400 text-xs border-b">
                  --- End of {dataEntries.length} entries ---
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer with Save/Close buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-500">
            {hasUnsavedChanges() ? (
              <span className="text-orange-600">You have unsaved changes</span>
            ) : (
              <span>All changes saved</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSaveChanges}
              disabled={!hasUnsavedChanges() || isSaving}
              className="bg-black hover:bg-gray-800 text-white"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
