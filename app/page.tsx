"use client";

import { useEffect, useState } from "react";
import { SimpleTreeView, TreeItem } from "@mui/x-tree-view";
import {
  Grid2,
  Checkbox,
  Typography,
  Paper,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
  TextField,
  Button,
  Fab,
} from "@mui/material";
import { styled } from "@mui/system";
import SettingsIcon from "@mui/icons-material/Settings";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Draggable from "react-draggable";
import { PaperProps } from "@mui/material/Paper";

function PaperComponent(props: PaperProps) {
  return (
    <Draggable
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
    >
      <Paper {...props} />
    </Draggable>
  );
}
// Styled components for better padding and a cleaner look
const StyledTreeItem = styled(TreeItem)(({ theme }) => ({
  marginBottom: theme.spacing(1),
}));

const FloatingButton = styled(Fab)(({ theme }) => ({
  position: "fixed",
  bottom: theme.spacing(4), // Adjust the distance from the bottom
  right: theme.spacing(4), // Adjust the distance from the right
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  height: "100%",
  maxHeight: "100%",
  overflowY: "auto", // Enable independent scrolling
}));

const SectionTree = ({ data, selectedPaths, onToggle }) => {
  return (
    <SimpleTreeView>
      {data.map((section, index) => {
        const currentPath = section.id;
        const isChecked = selectedPaths.includes(currentPath);
        const label = section.sliceName || section.label;

        const uniqueId = `${currentPath}-${index}`; // Generate a unique ID based on `id`

        return (
          <StyledTreeItem
            key={uniqueId}
            itemId={uniqueId} // Use `itemId` for uniqueness
            label={
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography variant="body2">{label}</Typography>
                {/* Checkbox for each section */}
                <Checkbox
                  size="small"
                  checked={isChecked}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent TreeItem expansion
                    onToggle(currentPath);
                  }}
                />
              </Box>
            }
          >
            {section.children && (
              <List>
                {section.children.map((child, childIndex) => (
                  <ListItem key={childIndex}>
                    <ListItemText
                      primary={child.short || child.sliceName || "Untitled"}
                      secondary={
                        <>
                          {child.patternCodeableConcept?.coding && (
                            <>
                              <strong>Code:</strong>{" "}
                              {child.patternCodeableConcept.coding[0]?.code ||
                                "Unknown"}
                              <br />
                              <strong>System:</strong>{" "}
                              {child.patternCodeableConcept.coding[0]?.system ||
                                "Unknown"}
                            </>
                          )}
                          {child.text && (
                            <>
                              <strong>Text 1:</strong>{" "}
                              {child.text.short || "No Text Available"}
                            </>
                          )}
                        </>
                      }
                    />
                    {childIndex < section.children.length - 1 && <Divider />}
                  </ListItem>
                ))}
              </List>
            )}
          </StyledTreeItem>
        );
      })}
    </SimpleTreeView>
  );
};

// Function to update the target JSON dynamically based on user selection
const updateTargetJson = (data, selectedPaths, originalJson, originalData) => {
  const result = { ...originalJson }; // Clone the default JSON structure
  result.section = [];

  data.forEach((section) => {
    const sectionIdParts = section.id.split(":");
    const sectionKey = sectionIdParts[sectionIdParts.length - 1];
    console.log(selectedPaths);
    // Initialize a section when first encountering the `Composition.section:section_name`
    // if (sectionKey === sectionIdParts[1]) {
    //   if (selectedPaths.includes(section.id)) {
    //     // Create or update the section
    //     let newSection = {
    //       title: section.label || section.short || section.sliceName,
    //       code: {},
    //       text: {
    //         status: 'generated',
    //         div: "<div xmlns='http://www.w3.org/1999/xhtml'>Placeholder text content</div>"
    //       },
    //       entry: []
    //     };

    //     // Add the section to the result
    //     result.section.push(newSection);
    //   }
    // }

    // Handle title, code, text cases
    let existingSection = originalData.find(
      (s) => s.title === section.label || section.sliceName
    );
    console.log(
      originalData.find((s) => s.title === section.label || section.sliceName)
    );
    if (existingSection && selectedPaths.includes(section.id)) {
      switch (sectionKey) {
        case "title":
          existingSection.title = section.short || section.label;
          break;
        case "entry":
          if (section.sliceName && selectedPaths.includes(section.id)) {
            // Handle entry if present
            existingSection.entry.push({
              reference: section.sliceName,
              targetProfile: section.type ? section.type[0]?.targetProfile : [],
            });
          }
          break;
        default:
          break;
      }
      result.section.push(existingSection);
    }
  });

  return result;
};

export default function Home() {
  const [sections, setSections] = useState([]);
  const [selectedPaths, setSelectedPaths] = useState([]);
  const [targetJson, setTargetJson] = useState({});
  const [exampleJsonData, setJsonData] = useState([]);
  const [open, setOpen] = useState(false);

  const [specUrl, setSpecUrl] = useState(
    "https://www.hl7.org/fhir/us/ccda/StructureDefinition-Progress-Note.json"
  );
  const [exampleUrl, setExampleUrl] = useState(
    "https://www.hl7.org/fhir/us/ccda/Composition-Progress-Note-Example.json"
  );
  const [newSpecUrl, setNewSpecUrl] = useState(specUrl);
  const [newExampleUrl, setNewExampleUrl] = useState(exampleUrl);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSaveUrls = () => {
    setSpecUrl(newSpecUrl);
    setExampleUrl(newExampleUrl);
    handleClose();
  };

  // Fetch both JSONs: Spec and Example
  useEffect(() => {
    const fetchJson = async () => {
      const specRes = await fetch(specUrl);
      const specData = await specRes.json();

      const exampleRes = await fetch(exampleUrl);
      const exampleData = await exampleRes.json();

      // Set the default example JSON to the builder
      setTargetJson(exampleData);
      console.log("exampleData", exampleData);
      console.log("test212 ", { ...exampleData }.section);
      setJsonData({ ...exampleData }.section);

      // Filter and structure only sections for display and selection
      if (specData.differential && specData.differential.element) {
        const sectionData = specData.differential.element.reduce(
          (acc, item) => {
            // Extract base item and sectionId
            const itemBase = item.id.split(":")[0];
            const sectionId = item.id.includes("section:")
              ? item.id.split(":")[1].split(".")[0]
              : "";

            const isSection = item.id.includes("section:"); // Flag to check if it's a section-level element
            let sectionExists = acc.find((s) => s.id === sectionId);

            // Handle section-level elements
            if (isSection && !sectionExists) {
              // Initialize the section if it doesn't exist
              sectionExists = {
                id: sectionId,
                path: item.path.split("Composition.")[1],
                short: item.short,
                label: item.label,
                children: [], // To store subsections like title, code, text, etc.
              };
              acc.push(sectionExists);
            }

            // Determine whether the item is related to a specific section
            const sectionItemKey = item.id.split(".").pop();

            const sectionData = {
              id: item.id,
              path: item.path.split("Composition.")[1],
              short: item.short,
              label: item.label,
              patternCodeableConcept: item.patternCodeableConcept,
            };

            if (sectionExists && sectionItemKey !== sectionId) {
              sectionExists.children.push({
                ...sectionData,
                key: sectionItemKey,
              });
            }

            return acc;
          },
          []
        );
        setSections(sectionData);
        const allSectionIds = sectionData.map((section) => section.id);
        setSelectedPaths(allSectionIds); // Preselect all sections
        console.log("Parsed section data:", sectionData);
      }
    };
    fetchJson();
  }, [specUrl, exampleUrl]);

  // Handle toggling of selected section paths
  const handleToggleSection = (path: any) => {
    const newSelectedPaths = selectedPaths.includes(path)
      ? selectedPaths.filter((p) => p !== path)
      : [...selectedPaths, path];
    setSelectedPaths(newSelectedPaths);

    // Update the target JSON dynamically
    setTargetJson(
      updateTargetJson(sections, newSelectedPaths, targetJson, exampleJsonData)
    );
  };

  const clearSelections = () => {
    setSelectedPaths([]);
    setTargetJson(updateTargetJson(sections, [], targetJson, exampleJsonData));
  };

  return (
    <>
      <Grid2 container spacing={2} sx={{ height: "100vh", padding: 2 }}>
        {/* Left Column - JSON Spec Tree View */}
        <Grid2 size={6} sx={{ maxHeight: "98vh", overflowY: "auto" }}>
          <StyledPaper>
            <Typography variant="h6" gutterBottom>
              Resource Options (Available sections: {exampleJsonData?.length} )
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              onClick={clearSelections}
            >
              Clear Selections
            </Button>
            {sections.length > 0 ? (
              <SectionTree
                data={sections}
                selectedPaths={selectedPaths}
                onToggle={handleToggleSection}
              />
            ) : (
              <Typography>Loading Sections...</Typography>
            )}
          </StyledPaper>
        </Grid2>

        {/* Right Column - Builder (JSON Example) */}
        <Grid2 size={6} sx={{ maxHeight: "98vh", overflowY: "auto" }}>
          <StyledPaper>
            <Typography variant="h6" gutterBottom>
              JSON Builder
            </Typography>
            <Paper sx={{ maxHeight: "90vh", overflowY: "auto", padding: 2 }}>
              {targetJson ? (
                <pre>{JSON.stringify(targetJson, null, 2)}</pre>
              ) : (
                <Typography>Loading Builder...</Typography>
              )}
            </Paper>
          </StyledPaper>
        </Grid2>
      </Grid2>
      <FloatingButton color="primary" aria-label="add" onClick={handleOpen}>
        <SettingsIcon />
      </FloatingButton>

      <Dialog
        open={open}
        onClose={handleClose}
        PaperComponent={PaperComponent}
        aria-labelledby="draggable-dialog-title"
        fullWidth={true}
        maxWidth={"lg"}
      >
        <DialogTitle style={{ cursor: "move" }} id="draggable-dialog-title">
          Update Resource URLs
        </DialogTitle>
        <DialogContent>
          <DialogContentText>Set Resource URL</DialogContentText>
          <TextField
            fullWidth
            label="Spec URL"
            value={newSpecUrl}
            onChange={(e) => setNewSpecUrl(e.target.value)}
            margin="normal"
          />

          <DialogContentText>Set JSON example URL</DialogContentText>
          <TextField
            fullWidth
            label="Example URL"
            value={newExampleUrl}
            onChange={(e) => setNewExampleUrl(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveUrls}
            sx={{ mt: 2 }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
