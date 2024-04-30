import { useEffect, useState } from "react";
import { json } from "@remix-run/node";
import { useActionData, useNavigate, useLoaderData } from "@remix-run/react";
import {
  Card,
  Bleed,
  Button,
  Divider,
  InlineStack,
  Layout,
  Page,
  Text,
  Thumbnail,
  BlockStack,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { ImageIcon } from "@shopify/polaris-icons";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const id = getFirst10CustomerList(admin);

  return id;
};

async function getFirst10CustomerList(admin) {
  const response = await admin.graphql(
    `#graphql
    query {
      customers(first: 10) {
        edges {
          node {
            id
            displayName
            email
          }
        }
      }
    }`,
  );

  const responseJson = await response.json();
  const emails = [];

  const edges = responseJson.data.customers.edges;

  for (let value of edges) {
    emails.push(value.node.email);
  }
  return emails;
}

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        input: {
          title: `${color} Snowboard`,
        },
      },
    },
  );
  const responseJson = await response.json();
  const variantId =
    responseJson.data.productCreate.product.variants.edges[0].node.id;
  const variantResponse = await admin.graphql(
    `#graphql
      mutation updateVariant($input: ProductVariantInput!) {
        productVariantUpdate(input: $input) {
          productVariant {
            id
            price
            barcode
            createdAt
          }
        }
      }`,
    {
      variables: {
        input: {
          id: variantId,
          price: Math.random() * 100,
        },
      },
    },
  );
  const variantResponseJson = await variantResponse.json();

  return json({
    product: responseJson.data.productCreate.product,
    variant: variantResponseJson.data.productVariantUpdate.productVariant,
  });
};

export default function Index() {
  const navigate = useNavigate();

  const customerId = useLoaderData();
  const actionData = useActionData();
  // const productId = actionData?.product?.id.replace(
  //   "gid://shopify/Product/",
  //   "",
  // );

  const [productForm, setProductForm] = useState({
    id: null,
    handle: null,
    Image: null,
    title: null,
  });

  const [collectionForm, setCollectionForm] = useState({
    id: null,
    handle: null,
    Image: null,
    title: null,
  });

  const [modal, setModal] = useState(null);
  useEffect(() => {
    setModal(document.getElementById("my-modal"));
  }, []);

  // useEffect(() => {
  //   if (productId) {
  //     shopify.toast.show("Product created");
  //   }
  // }, [productId]);

  async function selectCustomer() {
    console.log("select customer");
    console.log(customerId);
  }

  async function selectProduct() {
    console.log("select product");
    // console.log(productId);
    const products = await window.shopify.resourcePicker({
      type: "product",
      action: "select", // customized action verb, either 'select' or 'add',
    });

    if (products) {
      const { images, id, title, handle } = products[0];

      setProductForm({
        ...productForm,
        id: id,
        title: title,
        handle: handle,
        Image: images[0]?.originalSrc,
      });
    }

    console.log(products[0].handle);
  }

  async function selectCollection() {
    console.log("select collection");
    const collections = await window.shopify.resourcePicker({
      type: "collection",
      action: "select", // customized action verb, either 'select' or 'add',
    });

    if (collections) {
      const { image, id, title, handle } = collections[0];

      setCollectionForm({
        ...collectionForm,
        id: id,
        title: title,
        handle: handle,
        Image: image,
      });
    }

    console.log(collections[0].handle);
  }

  return (
    <Page>
      <ui-title-bar title={"App to Test Store Resources"}>
        <button variant="breadcrumb" onClick={() => navigate("/app")}>
          New App
        </button>
      </ui-title-bar>
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Card>
              <BlockStack gap="500">
                <Text as={"h2"} variant="headingLg">
                  Customer
                </Text>
                <BlockStack gap="200">
                  <Button
                    onClick={() => {
                      selectCustomer();
                      modal && modal.show();
                    }}
                    id="select-customer"
                  >
                    Select Customers Nova
                  </Button>
                </BlockStack>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="500">
                <InlineStack align="space-between">
                  <Text as={"h2"} variant="headingLg">
                    Product
                  </Text>
                  {productForm.id ? (
                    <Button variant="plain" onClick={selectProduct}>
                      Change product
                    </Button>
                  ) : null}
                </InlineStack>
                {productForm.id ? (
                  <InlineStack blockAlign="center" gap="500">
                    <Thumbnail source={productForm.Image || ImageIcon} />
                    <Text as="span" variant="headingMd" fontWeight="semibold">
                      {productForm.title}
                    </Text>
                  </InlineStack>
                ) : (
                  <BlockStack gap="200">
                    <Button onClick={selectProduct} id="select-product">
                      Select product
                    </Button>
                  </BlockStack>
                )}
                <Bleed marginInlineStart="200" marginInlineEnd="200">
                  <Divider />
                </Bleed>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="500">
                <InlineStack align="space-between">
                  <Text as={"h2"} variant="headingLg">
                    Collection
                  </Text>
                  {collectionForm.id ? (
                    <Button variant="plain" onClick={selectCollection}>
                      Change Collection
                    </Button>
                  ) : null}
                </InlineStack>
                {collectionForm.id ? (
                  <InlineStack blockAlign="center" gap="500">
                    <Thumbnail source={collectionForm.Image || ImageIcon} />
                    <Text as="span" variant="headingMd" fontWeight="semibold">
                      {collectionForm.title}
                    </Text>
                  </InlineStack>
                ) : (
                  <BlockStack gap="200">
                    <Button onClick={selectCollection} id="select-product">
                      Select Collection
                    </Button>
                  </BlockStack>
                )}
                <Bleed marginInlineStart="200" marginInlineEnd="200">
                  <Divider />
                </Bleed>
              </BlockStack>
            </Card>
            <ui-modal id="my-modal" variant="base">
              <form data-save-bar>
                <label>
                  Name:
                  <input name="submitted-name" autoComplete="name" />
                </label>
                <button onClick={() => modal && modal.hide()}>Save</button>
              </form>
              <ui-title-bar>
                <button variant="primary" onClick={() => modal && modal.hide()}>
                  Save
                </button>
                <button onClick={() => modal && modal.hide()}>Cancel</button>
              </ui-title-bar>
            </ui-modal>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
