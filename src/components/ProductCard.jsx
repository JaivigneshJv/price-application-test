import React, {useEffect, useState} from "react";
import {S3Client, GetObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  CardMedia,
  Box,
  Chip,
  Stack,
} from "@mui/material";

const REGION = "us-east-1";
const BUCKET_NAME = "jv-web-server-product-data";

const s3 = new S3Client({
  region: REGION,
});

function ProductCard({searchQuery}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProductData = async () => {
    try {
      setLoading(true);
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: "product_data.json",
      });
      const response = await s3.send(command);
      const jsonData = await response.Body.transformToString("utf-8");
      const sanitizedData = jsonData.replace(/Infinity/g, '"Unavailable"');
      const productsData = JSON.parse(sanitizedData).products;

      // Fetch signed URLs for product images
      const updatedProducts = await Promise.all(
        productsData.map(async (product) => {
          const updatedSites = await Promise.all(
            product.sites.map(async (site) => {
              const imageCommand = new GetObjectCommand({
                Bucket: BUCKET_NAME,
                Key: site.image,
              });
              const imageUrl = await getSignedUrl(s3, imageCommand, {
                expiresIn: 3600,
              });
              return {...site, image: imageUrl};
            })
          );
          return {...product, sites: updatedSites};
        })
      );

      setProducts(updatedProducts);
    } catch (err) {
      console.error("Error fetching product data:", err);
      setError("Failed to fetch product data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductData();
  }, []);

  const filteredProducts = products.filter((product) =>
    product.product_name.toLowerCase().includes(searchQuery)
  );

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{color: "red"}}>{error}</p>;

  return (
    <Grid container spacing={2} columns={12}>
      {filteredProducts.map((product) => {
        const lowestPriceSite = product.sites.reduce((prev, curr) =>
          prev.price < curr.price ? prev : curr
        );

        const otherSites = product.sites.filter(
          (site) => site.website !== lowestPriceSite.website
        );

        return (
          <Grid item xs={12} sm={6} md={3} key={product.product_name}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: 4,
                boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  {product.product_name.replace(/-/g, " ")}
                </Typography>
                <CardMedia
                  component="img"
                  height="140"
                  image={lowestPriceSite.image}
                  alt={product.product_name}
                  sx={{borderRadius: 2, objectFit: "contain"}}
                />
                <Box mt={2}>
                  <Typography variant="h6" color="green">
                    ₹{lowestPriceSite.price} on {lowestPriceSite.website}
                  </Typography>
                </Box>
                <Box mt={2}>
                  <Typography variant="subtitle1" gutterBottom>
                    Other Prices:
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    {otherSites.map((site) => (
                      <Chip
                        key={site.website}
                        label={`${site.website}: ₹${site.price}`}
                        variant="outlined"
                        onClick={() => window.open(site.url, "_blank")}
                        sx={{
                          fontWeight: "bold",
                          borderColor: "grey.500",
                          color: "grey.800",
                          cursor: "pointer",
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              </CardContent>
              <Button
                variant="contained"
                color="primary"
                href={lowestPriceSite.url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{m: 2}}>
                View on {lowestPriceSite.website}
              </Button>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}

export default ProductCard;
