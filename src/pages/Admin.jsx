import React, {useState} from "react";
import axios from "axios";
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  TextField,
  Button,
  Stack,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";

const Admin = () => {
  const [productName, setProductName] = useState("");
  const [urls, setUrls] = useState(["", ""]); // Minimum 2 URLs
  const [responseMessage, setResponseMessage] = useState("");
  const [loading, setLoading] = useState(false); // Loading state for Refresh button

  const handleProductNameChange = (e) => {
    const formattedName = e.target.value.toLowerCase().replace(/\s+/g, "-");
    setProductName(formattedName);
  };

  const handleUrlChange = (index, value) => {
    const updatedUrls = [...urls];
    updatedUrls[index] = value;
    setUrls(updatedUrls);
  };

  const addMoreUrlFields = () => {
    setUrls([...urls, ""]); // Add a new empty URL field
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      product_name: productName,
      urls,
    };
    try {
      const response = await axios.post(
        "https://4zxst525di.execute-api.us-east-1.amazonaws.com/prod/add-product",
        payload
      );
      setResponseMessage("Product added successfully!");
    } catch (error) {
      console.error("Error adding product:", error);
      setResponseMessage("Failed to add product. Please try again.");
    }
  };

  const handleRefresh = async () => {
    setLoading(true); // Show loading indicator on Refresh
    try {
      await axios.post(
        "https://4zxst525di.execute-api.us-east-1.amazonaws.com/prod/refresh-prices"
      );
      setResponseMessage("Prices refreshed successfully!");
    } catch (error) {
      console.error("Error refreshing prices:", error);
      setResponseMessage("Failed to refresh prices. Please try again.");
    } finally {
      setLoading(false); // Hide loading indicator
    }
  };

  return (
    <div>
      <Box sx={{flexGrow: 1, marginBottom: 1}}>
        <AppBar position="static">
          <Toolbar>
            <IconButton size="large" edge="start" color="inherit">
            </IconButton>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{flexGrow: 1, display: {xs: "none", sm: "block"}}}>
              PRICE TRACKER - ADMIN CONSOLE
            </Typography>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={
                loading ? <CircularProgress size={20} /> : <RefreshIcon />
              }
              onClick={handleRefresh}
              disabled={loading}
              sx={{marginRight: 2}}>
              Refresh Prices
            </Button>
          </Toolbar>
        </AppBar>
      </Box>

      <Box sx={{padding: 10}}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Product Name"
              variant="outlined"
              fullWidth
              value={productName}
              onChange={handleProductNameChange}
              required
              placeholder="Enter product name (e.g., apple iphone 16)"
            />

            {urls.map((url, index) => (
              <TextField
                key={index}
                label={`URL ${index + 1}`}
                variant="outlined"
                fullWidth
                value={url}
                onChange={(e) => handleUrlChange(index, e.target.value)}
                required
                placeholder="Enter product URL"
              />
            ))}

            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addMoreUrlFields}>
              Add More URLs
            </Button>

            <Button type="submit" variant="contained" color="primary">
              Submit Product
            </Button>

            {responseMessage && (
              <Typography color="secondary">{responseMessage}</Typography>
            )}
          </Stack>
        </form>
      </Box>
    </div>
  );
};

export default Admin;
