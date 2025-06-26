"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Copy,
  Eye,
  MoreHorizontal,
  User,
  Settings,
  LogOut,
  Plus,
  Trash2,
  Edit,
  RefreshCw,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import DatasetViewModal from "./DatasetViewModal";
import CreateVariableModal from "./CreateVariableModal";
import { apiClient, Dataset } from "@/lib/api";
import { authService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface DashboardDataset extends Dataset {
  itemCount: number;
}

export default function DatasetsDashboard() {
  const [datasets, setDatasets] = useState<DashboardDataset[]>([]);
  const [filteredDatasets, setFilteredDatasets] = useState<DashboardDataset[]>(
    []
  );
  const [categories, setCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [loading, setLoading] = useState(true);
  const [selectedDataset, setSelectedDataset] =
    useState<DashboardDataset | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [totalDatasets, setTotalDatasets] = useState(0);
  const { toast } = useToast();

  // Get current user
  const currentUser = authService.getUser();

  // Update selected dataset when datasets change (after refresh)
  useEffect(() => {
    if (selectedDataset && datasets.length > 0) {
      const updatedDataset = datasets.find(
        (d) => d._id === selectedDataset._id
      );
      if (updatedDataset) {
        const updatedSelectedDataset: DashboardDataset = {
          ...updatedDataset,
          itemCount: updatedDataset.data.length,
        };
        // Only update if the data actually changed
        if (
          JSON.stringify(updatedDataset.data) !==
          JSON.stringify(selectedDataset.data)
        ) {
          setSelectedDataset(updatedSelectedDataset);
          console.log(
            "Auto-updated selected dataset with fresh data:",
            updatedSelectedDataset
          );
        }
      }
    }
  }, [datasets, selectedDataset]);

  // Load datasets and categories from API
  const loadData = async () => {
    try {
      setLoading(true);

      // Load datasets and categories in parallel
      const [datasetsResponse, categoriesResponse] = await Promise.all([
        apiClient.getDatasets({ limit: 100 }),
        apiClient.getCategories(),
      ]);

      // Transform datasets to include itemCount
      const transformedDatasets: DashboardDataset[] =
        datasetsResponse.datasets.map((dataset) => ({
          ...dataset,
          itemCount: dataset.data.length,
        }));

      setDatasets(transformedDatasets);
      setFilteredDatasets(transformedDatasets);
      setTotalDatasets(datasetsResponse.total);

      // Set categories with "All Categories" option
      setCategories(["All Categories", ...categoriesResponse.categories]);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({
        title: "Error",
        description: "Failed to load datasets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter datasets based on search and category
  useEffect(() => {
    let filtered = datasets;

    if (searchTerm) {
      filtered = filtered.filter(
        (dataset) =>
          dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (dataset.description &&
            dataset.description
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (dataset.category &&
            dataset.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory !== "All Categories") {
      filtered = filtered.filter(
        (dataset) => dataset.category === selectedCategory
      );
    }

    setFilteredDatasets(filtered);
  }, [datasets, searchTerm, selectedCategory]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `"${text}" copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleViewDataset = (dataset: DashboardDataset) => {
    setSelectedDataset(dataset);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDataset(null);
  };

  const handleDatasetUpdated = async () => {
    console.log("Dataset updated, refreshing data...");
    // Reload data to get the latest - the useEffect will handle updating selectedDataset
    await loadData();
  };

  const handleCreateVariable = async (variable: {
    name: string;
    category: string;
    data: string[];
    description?: string;
  }) => {
    try {
      const newDataset = await apiClient.createDataset({
        name: variable.name,
        description: variable.description || `Dataset for ${variable.name}`,
        category: variable.category,
        data: variable.data,
      });

      // Reload data to get the latest
      await loadData();

      toast({
        title: "Success!",
        description: `Dataset "${variable.name}" created successfully`,
      });
    } catch (error) {
      console.error("Failed to create dataset:", error);
      toast({
        title: "Error",
        description: "Failed to create dataset. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDataset = async (dataset: DashboardDataset) => {
    if (!confirm(`Are you sure you want to delete "${dataset.name}"?`)) {
      return;
    }

    // Check if user is authenticated before attempting delete
    if (!authService.isAuthenticated()) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to delete datasets.",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiClient.deleteDataset(dataset._id);
      await loadData(); // Reload data

      toast({
        title: "Deleted!",
        description: `Dataset "${dataset.name}" deleted successfully`,
      });
    } catch (error) {
      console.error("Failed to delete dataset:", error);

      // Provide more specific error messages
      let errorMessage = "Failed to delete dataset. Please try again.";

      if (error instanceof Error) {
        if (error.message.includes("401")) {
          errorMessage = "Authentication failed. Please sign in again.";
          // Optionally redirect to login or refresh auth
        } else if (error.message.includes("404")) {
          errorMessage = "Dataset not found. It may have already been deleted.";
        } else if (error.message.includes("403")) {
          errorMessage = "You don't have permission to delete this dataset.";
        } else if (error.message.includes("500")) {
          errorMessage = "Server error occurred. Please try again later.";
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleSignOut = () => {
    authService.signOut();
  };

  const getCategoryBadgeVariant = (category: string) => {
    switch (category?.toLowerCase()) {
      case "names":
        return "default";
      case "contact":
        return "secondary";
      case "business":
        return "outline";
      case "location":
        return "destructive";
      case "design":
        return "default";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading datasets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Data Fill Plugin Variables
              </h1>
              <p className="text-gray-600 mt-1">
                Manage mock data for your Figma plugin • {totalDatasets} total
                datasets
              </p>
            </div>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={currentUser?.picture}
                      alt={currentUser?.name}
                    />
                    <AvatarFallback>
                      {currentUser?.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {currentUser?.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentUser?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search variables by name, description, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Create Variable Button */}
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-black hover:bg-gray-800 text-white whitespace-nowrap"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Variable
          </Button>

          {/* Refresh Button */}
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Results Count */}
        <p className="text-sm text-gray-600 mb-4">
          Showing {filteredDatasets.length} of {datasets.length} variables
        </p>

        {/* Data Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">No.</TableHead>
                  <TableHead>Variable Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Updated</TableHead>
                  <TableHead className="text-center">Mock Data</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDatasets.map((dataset, index) => (
                  <TableRow key={dataset._id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{dataset.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(dataset.name)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate text-sm text-gray-600">
                        {dataset.description || "No description"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {dataset.category ? (
                        <Badge
                          variant={getCategoryBadgeVariant(dataset.category)}
                        >
                          {dataset.category}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">
                          No category
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="text-sm">
                        <div>{formatDate(dataset.updatedAt)}</div>
                        <div className="text-gray-500">
                          {new Date(dataset.updatedAt).getFullYear()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDataset(dataset)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View ({dataset.itemCount})
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewDataset(dataset)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => copyToClipboard(dataset.name)}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Name
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteDataset(dataset)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Empty State */}
        {filteredDatasets.length === 0 && !loading && (
          <Card className="mt-6">
            <CardContent className="text-center py-12">
              <p className="text-gray-500 text-lg mb-2">
                {searchTerm || selectedCategory !== "All Categories"
                  ? "No variables found"
                  : "No datasets yet"}
              </p>
              <p className="text-gray-400 mb-4">
                {searchTerm || selectedCategory !== "All Categories"
                  ? "Try adjusting your search or filter to find what you're looking for."
                  : "Create your first dataset to get started."}
              </p>
              {!searchTerm && selectedCategory === "All Categories" && (
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-black hover:bg-gray-800 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Variable
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Dataset View Modal */}
      <DatasetViewModal
        dataset={selectedDataset}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onDatasetUpdated={handleDatasetUpdated}
      />

      {/* Create Variable Modal */}
      <CreateVariableModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateVariable}
        categories={categories.filter((cat) => cat !== "All Categories")}
      />
    </div>
  );
}
