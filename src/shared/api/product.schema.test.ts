import {
  productFormSchema,
  productSchema,
  type ProductFormInput,
} from "./product.schema";

function validFormInput(): ProductFormInput {
  return {
    name: "旅行收納包",
    slug: "travel-pouch",
    description: "輕巧好收納",
    category: "旅遊小物",
    imageUrl: "https://example.com/image.png",
    minPrice: "100",
    maxPrice: "200",
    status: "draft",
    featured: false,
  };
}

function validProduct() {
  const now = new Date().toISOString();
  return {
    id: "96784776-469d-4c9b-b70e-f760a9fe1513",
    name: "旅行收納包",
    slug: "travel-pouch",
    description: "輕巧好收納",
    category: "旅遊小物" as const,
    imageUrl: "https://example.com/image.png",
    minPrice: 100,
    maxPrice: 200,
    status: "draft" as const,
    featured: false,
    createdAt: now,
    updatedAt: now,
  };
}

describe("productFormSchema", () => {
  it("converts string prices into numbers", () => {
    const result = productFormSchema.parse(validFormInput());
    expect(result.minPrice).toBe(100);
    expect(result.maxPrice).toBe(200);
  });

  it("accepts numeric prices", () => {
    const result = productFormSchema.parse({
      ...validFormInput(),
      minPrice: 50,
      maxPrice: 80,
    });
    expect(result.minPrice).toBe(50);
    expect(result.maxPrice).toBe(80);
  });

  it.each(["", "abc", "12abc"])("rejects invalid price string: %s", (value) => {
    expect(
      productFormSchema.safeParse({
        ...validFormInput(),
        minPrice: value,
      }).success,
    ).toBe(false);
  });

  it("rejects negative prices", () => {
    expect(
      productFormSchema.safeParse({
        ...validFormInput(),
        minPrice: -1,
      }).success,
    ).toBe(false);
  });

  it("rejects maxPrice lower than minPrice", () => {
    const result = productFormSchema.safeParse({
      ...validFormInput(),
      minPrice: 300,
      maxPrice: 100,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.path[0] === "maxPrice"),
      ).toBe(true);
    }
  });

  it("accepts equal minPrice and maxPrice", () => {
    expect(
      productFormSchema.safeParse({
        ...validFormInput(),
        minPrice: 100,
        maxPrice: 100,
      }).success,
    ).toBe(true);
  });

  it.each([
    "https://example.com/a.png",
    "http://example.com/a.jpg",
    "data:image/png;base64,AAAA",
  ])("accepts valid image URL: %s", (imageUrl) => {
    expect(
      productFormSchema.safeParse({
        ...validFormInput(),
        imageUrl,
      }).success,
    ).toBe(true);
  });

  it.each(["", "ftp://example.com/image.png", "not-a-url"])(
    "rejects invalid image URL: %s",
    (imageUrl) => {
      expect(
        productFormSchema.safeParse({
          ...validFormInput(),
          imageUrl,
        }).success,
      ).toBe(false);
    },
  );

  it("rejects unsupported category", () => {
    expect(
      productFormSchema.safeParse({
        ...validFormInput(),
        category: "電子產品",
      }).success,
    ).toBe(false);
  });

  it("rejects invalid slug", () => {
    expect(
      productFormSchema.safeParse({
        ...validFormInput(),
        slug: "Invalid Slug!",
      }).success,
    ).toBe(false);
  });

  it("trims form strings", () => {
    const result = productFormSchema.parse({
      ...validFormInput(),
      name: "  旅行收納包  ",
      slug: "  travel-pouch  ",
      description: "  description  ",
    });
    expect(result.name).toBe("旅行收納包");
    expect(result.slug).toBe("travel-pouch");
    expect(result.description).toBe("description");
  });
});

describe("productSchema", () => {
  it("accepts valid product", () => {
    expect(productSchema.safeParse(validProduct()).success).toBe(true);
  });

  it("rejects invalid UUID", () => {
    expect(
      productSchema.safeParse({
        ...validProduct(),
        id: "invalid",
      }).success,
    ).toBe(false);
  });

  it("rejects negative prices", () => {
    expect(
      productSchema.safeParse({
        ...validProduct(),
        minPrice: -1,
      }).success,
    ).toBe(false);
  });

  it("rejects unsupported category", () => {
    expect(
      productSchema.safeParse({
        ...validProduct(),
        category: "unknown",
      }).success,
    ).toBe(false);
  });

  it("rejects invalid datetime", () => {
    expect(
      productSchema.safeParse({
        ...validProduct(),
        updatedAt: "2026-01-01",
      }).success,
    ).toBe(false);
  });
});
