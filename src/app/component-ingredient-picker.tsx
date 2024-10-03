"use client";

import useSWR from "swr";
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import type { Ingredient } from "./api/ingredients/types";
import { useCallback, useMemo, useState } from "react";
import Fuse from "fuse.js";

const IngredientPicker: React.FC<{
  ingredients: Ingredient[];
  ingredient?: Ingredient;
  onChange?: (ingredient: Ingredient) => void;
}> = ({ ingredient, ingredients, onChange }) => {
  const [query, setQuery] = useState<string>("");
  const clearQuery = useCallback(() => setQuery(""), [setQuery]);

  const fuse = useMemo(
    () => new Fuse(ingredients, { keys: ["name"] }),
    [ingredients]
  );
  const filteredIngredients = useMemo(
    (): Ingredient[] =>
      query.trim() === ""
        ? ingredients
        : fuse.search(query, {}).map(({ item }) => item),
    [fuse, query, ingredients]
  );

  return (
    <Combobox
      value={ingredient ?? null}
      onChange={onChange}
      onClose={clearQuery}
      immediate
    >
      <ComboboxInput
        aria-label="Ingredient"
        className="p-2"
        placeholder="Select ingredient"
        displayValue={(ingredient: Ingredient | null | undefined) =>
          ingredient?.name ?? ""
        }
        onChange={(event) => setQuery(event.target.value)}
      />

      <ComboboxOptions anchor="bottom" className="border empty:invisible">
        {filteredIngredients.map((ingredient) => (
          <ComboboxOption
            key={ingredient.name}
            value={ingredient}
            disabled={!ingredient.available}
            className="w-[var(--input-width)] p-2 bg-backgroundSecondary text-textSecondary data-[focus]:bg-textSecondary data-[focus]:text-backgroundSecondary"
          >
            {ingredient.name}
          </ComboboxOption>
        ))}
      </ComboboxOptions>
    </Combobox>
  );
};

export default IngredientPicker;
