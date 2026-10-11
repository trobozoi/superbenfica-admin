import { describe, expect, it } from "vitest";
import { BFF_ROUTES, COSMOS_CDN, OPEN_FOOD_FACTS } from "@/config/endpoints";

const GTIN = "7891000100103";

describe("endpoints de código de barras", () => {
  it("Open Food Facts pede só os campos usados", () => {
    expect(OPEN_FOOD_FACTS.url(GTIN)).toBe(
      `${OPEN_FOOD_FACTS.origin}/api/v2/product/${GTIN}.json?fields=product_name,product_name_pt,quantity`,
    );
  });

  it("foto do Cosmos no CDN", () => {
    expect(COSMOS_CDN.fotoUrl(GTIN)).toBe(`https://cdn-cosmos.bluesoft.com.br/products/${GTIN}`);
  });

  it("foto do Cosmos pelo BFF", () => {
    expect(BFF_ROUTES.gtinFoto(GTIN)).toBe(`/api/gtin/${GTIN}/foto`);
  });
});
