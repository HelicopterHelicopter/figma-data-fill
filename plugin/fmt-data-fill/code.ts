// This plugin will fill text fields in a selected frame with random data based on field name prefixes

// Define types for our dataset structure
interface Dataset {
  description: string;
  data: string[];
}

interface Datasets {
  [key: string]: Dataset;
}

// API configuration
const API_BASE_URL = 'https://figma-be.jheels.in/api/v1';

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// Show the UI with increased height to accommodate the search functionality
figma.showUI(__html__, { width: 300, height: 450 });

// Function to get random item from an array
function getRandomItem(array: string[]): string {
  return array[Math.floor(Math.random() * array.length)];
}

// Function to find text nodes in a frame
function findTextNodes(node: SceneNode): TextNode[] {
  const textNodes: TextNode[] = [];
  
  if ('children' in node) {
    for (const child of node.children) {
      if (child.type === 'TEXT') {
        textNodes.push(child);
      } else if ('children' in child) {
        textNodes.push(...findTextNodes(child));
      }
    }
  }
  
  return textNodes;
}

// Function to extract dataset name from node name with d- prefix
function getDatasetNameFromNode(nodeName: string): string | null {
  const lowerName = nodeName.toLowerCase();
  
  // Check if node name starts with 'd-'
  if (lowerName.startsWith('d-')) {
    return lowerName.substring(2); // Remove 'd-' prefix
  }
  
  return null;
}

// Function to fetch datasets from API
async function fetchDatasets(): Promise<Datasets> {
  console.log('Starting fetch request to:', `${API_BASE_URL}/datasets/public`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/datasets/public`, {
      method: 'GET',
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
    }
    
    const datasets = await response.json();
    console.log('Fetched datasets:', datasets);
    console.log('Dataset keys:', Object.keys(datasets));
    return datasets;
  } catch (error) {
    console.error('Detailed fetch error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error message:', errorMessage);
    if (error instanceof TypeError) {
      console.error('This is likely a network connectivity issue');
    }
    throw error;
  }
}

// Function to send datasets to UI
function sendDatasetsToUI(datasets: Datasets) {
  figma.ui.postMessage({
    type: 'datasets-loaded',
    datasets: datasets
  });
}

// Function to send error to UI
function sendErrorToUI() {
  figma.ui.postMessage({
    type: 'datasets-error'
  });
}

// Handle messages from the UI
figma.ui.onmessage = async (msg: { type: string }) => {
  if (msg.type === 'load-datasets') {
    try {
      figma.notify('Loading datasets...');
      
      // Fetch datasets from API
      const datasets = await fetchDatasets();
      
      if (!datasets || Object.keys(datasets).length === 0) {
        figma.notify('No datasets found. Please add some datasets through the dashboard.');
        sendErrorToUI();
        return;
      }

      // Send datasets to UI for display
      sendDatasetsToUI(datasets);
      figma.notify('Datasets loaded successfully');
    } catch (error) {
      console.error('Error loading datasets:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      figma.notify(`Error loading datasets: ${errorMessage}`);
      sendErrorToUI();
    }
  } else if (msg.type === 'fill-data') {
    const selection = figma.currentPage.selection;
    
    if (selection.length === 0) {
      figma.notify('Please select a frame first');
      return;
    }

    const frame = selection[0];
    if (frame.type !== 'FRAME' && frame.type !== 'GROUP' && frame.type !== 'SECTION') {
      figma.notify('Please select a frame, group, or section');
      return;
    }

    try {
      figma.notify('Fetching datasets...');
      
      // Fetch datasets from API
      const datasets = await fetchDatasets();
      
      if (!datasets || Object.keys(datasets).length === 0) {
        figma.notify('No datasets found. Please add some datasets through the dashboard.');
        sendErrorToUI();
        return;
      }

      // Send datasets to UI for display
      sendDatasetsToUI(datasets);

      console.log('Available datasets:', Object.keys(datasets));
      
      const textNodes = findTextNodes(frame);
      console.log('Found text nodes:', textNodes.length);
      
      let filledCount = 0;

      for (const node of textNodes) {
        const nodeName = node.name;
        console.log('Checking node:', nodeName);
        
        // Extract dataset name from node name (e.g., 'd-names' -> 'names')
        const datasetName = getDatasetNameFromNode(nodeName);
        
        if (datasetName) {
          console.log('Extracted dataset name:', datasetName);
          
          // Check if we have a dataset with this name
          if (datasets[datasetName]) {
            console.log('Match found! Filling node with data from dataset:', datasetName);
            
            // Load the font before setting the text
            await figma.loadFontAsync(node.fontName as FontName);
            const randomValue = getRandomItem(datasets[datasetName].data);
            node.characters = randomValue;
            console.log('Filled node', nodeName, 'with:', randomValue);
            filledCount++;
          } else {
            console.log('No dataset found for:', datasetName);
          }
        } else {
          console.log('Node name does not match d- pattern:', nodeName);
        }
      }

      if (filledCount > 0) {
        figma.notify(`Filled ${filledCount} text fields with random data`);
      } else {
        const availableDatasets = Object.keys(datasets).map(name => `d-${name}`).join(', ');
        figma.notify(`No matching text fields found. Use names like: ${availableDatasets}`);
      }
    } catch (error) {
      console.error('Plugin error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      figma.notify(`Error: ${errorMessage}. Check console for details.`);
      sendErrorToUI();
    }
  }

  // Don't close the plugin so users can fill multiple frames
};
