import { GoogleAuth } from "google-auth-library";
import { sheets_v4, sheets } from "@googleapis/sheets";
import {
  tryCatchK as tryCatchKTE,
  map as mapTE,
  flatMapEither as flatMapEitherTE,
} from "fp-ts/lib/TaskEither";
import { tryCatchK as tryCatchKE } from "fp-ts/lib/Either";
import { filter as filterA } from "fp-ts/lib/Array";
import { constant, constFalse, constTrue, pipe } from "fp-ts/lib/function";
import { Ingredient } from "./types";
import { z, ZodSchema, ZodTypeDef } from "zod";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];

export const getAuth = () =>
  new GoogleAuth({
    scopes: SCOPES,
    projectId: undefined,
    credentials: {
      client_id: process.env.NEXT_PRIVATE_GOOGLE_CLIENT_ID,
      client_email: process.env.NEXT_PRIVATE_GOOGLE_CLIENT_EMAIL,
      private_key: process.env.NEXT_PRIVATE_GOOGLE_PRIVATE_KEY?.replace(
        /\\n/g,
        "\n"
      ),
      private_key_id: process.env.NEXT_PRIVATE_GOOGLE_PRIVATE_KEY_ID,
      project_id: process.env.NEXT_PRIVATE_GOOGLE_PROJECT_ID,
      universe_domain: "googleapis.com",
    },
  });

export const getIngredients =
  (auth: GoogleAuth) => (spreadsheetId: string) => (range?: string) =>
    pipe(
      getSheets(),
      tryCatchKTE(
        ({ spreadsheets }) =>
          spreadsheets.values.get({ auth, spreadsheetId, range }),
        (error) =>
          new Error(`Failed to get spreadsheet ${spreadsheetId}: ${error}`)
      ),
      mapTE((response): sheets_v4.Schema$ValueRange => response.data),
      flatMapEitherTE(deserializeIngredientsValues),
      mapTE(filterA(isNonEmptyIngedient))
    );

const getSheets = () => sheets("v4");

const deserializeIngredientsValues = tryCatchKE(
  (values: sheets_v4.Schema$ValueRange): Ingredient[] =>
    IngredientRowsSchema.parse(values.values),
  (error) => new Error(`Failed to parse an ingredient: ${error}`)
);

const isNonEmptyIngedient = (ingredient: Ingredient) =>
  ingredient.name.trim() !== "" &&
  ingredient.packPrice !== 0 &&
  ingredient.packQuantity !== 0;

const IngredientRowSchema = z
  .tuple([
    z.string(), // name
    z.union([
      z.literal("").transform(constant(1)),
      z
        .string()
        .transform((str) => str.replace(/,/g, ""))
        .pipe(z.coerce.number()),
    ]), // pack quantity
    z.coerce.number(), // pack price
    z.union([
      z.literal("FALSE").transform(constFalse),
      z.literal("TRUE").transform(constTrue),
    ]), // available
  ])
  .transform(([name, packQuantity, packPrice, available]) => ({
    name,
    packQuantity,
    packPrice,
    available,
  })) satisfies ZodSchema<Ingredient, ZodTypeDef, unknown>;

const IngredientRowsSchema = z.array(IngredientRowSchema);
