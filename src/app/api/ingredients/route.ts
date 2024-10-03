import { pipe, apply } from "fp-ts/lib/function";
import { NextResponse } from "next/server";
import { getAuth, getIngredients } from "./api";
import { toUnion, map, mapError } from "fp-ts/lib/TaskEither";

export async function GET() {
  return pipe(
    getAuth(),
    getIngredients,
    apply(process.env.NEXT_PRIVATE_GOOGLE_SHEET_ID!),
    apply("Prices!A2:E1000"),
    map((spreadsheet) => NextResponse.json(spreadsheet)),
    mapError((error) =>
      NextResponse.json({ error: error.message }, { status: 500 })
    ),
    toUnion
  )();
}
