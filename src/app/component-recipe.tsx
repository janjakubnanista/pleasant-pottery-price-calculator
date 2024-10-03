"use client";

import useSWR from "swr";
import type { Ingredient } from "./api/ingredients/types";
import { useCallback, useMemo, useState } from "react";
import { fromEntries } from "fp-ts/lib/ReadonlyRecord";
import { map, reduce, separate } from "fp-ts/lib/Array";
import { left, right } from "fp-ts/lib/Separated";
import { flow, pipe } from "fp-ts/lib/function";
import { Either, fromOption } from "fp-ts/lib/Either";
import { fromNullable, map as mapO, toNullable } from "fp-ts/lib/Option";
import { map as mapA } from "fp-ts/lib/Array";
import { lookup } from "fp-ts/lib/Record";
import IngredientPicker from "./component-ingredient-picker";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const Recipe: React.FC = () => {
  const { data: ingredients = NO_INGREDIENTS, isLoading } = useSWR<
    Ingredient[]
  >("/api/ingredients", fetcher);

  const [items, setItems] = useState<IRecipeItem[]>();
  const itemsWithIngredients = useMemo(
    () => findIngredients(ingredients, items),
    [ingredients, items]
  );
  const price = useMemo(
    () => calculatePrice(pipe(itemsWithIngredients, right)),
    [itemsWithIngredients]
  );
  const handleDeleteItem = useCallback(
    (item: IRecipeItem) =>
      setItems((values) =>
        values.filter((value) => value.ingredientName !== item.ingredientName)
      ),
    [setItems]
  );

  const handleAddItem = useCallback(
    (item: IRecipeItem) =>
      setItems((values) =>
        values
          .filter((value) => value.ingredientName !== item.ingredientName)
          .concat(item)
      ),
    [setItems]
  );

  if (isLoading) return <div className="p-2 text-center">Loading...</div>;

  return (
    <div className="flex flex-col">
      <NewRecipeItem ingredients={ingredients} onAdd={handleAddItem} />

      <div>
        {pipe(
          itemsWithIngredients,
          right,
          mapA((item) => (
            <RecipeItem
              key={item.ingredient.name}
              item={item}
              onDelete={handleDeleteItem}
            />
          ))
        )}

        <RecipeItemLayout name="Total price" amount={`$${price}`} />
      </div>

      <div>
        {pipe(
          itemsWithIngredients,

          left,
          mapA((item) => (
            <MissingIngredientRecipeItem
              key={item.ingredientName}
              item={item}
              onDelete={handleDeleteItem}
            />
          ))
        )}
      </div>
    </div>
  );
};

const RecipeItemLayout: React.FC<{
  name: React.ReactNode;
  amount: React.ReactNode;
  extra?: React.ReactNode;
}> = ({ name, amount, extra }) => {
  return (
    <div className="relative flex items-center justify-between gap-1 p-2 border-b border-b-current border-dashed">
      <div className="flex-shrink flex-grow">{name}</div>
      <div className="flex-grow-0">{amount}</div>
      {pipe(
        fromNullable(extra),
        mapO((extra) => <div className="absolute left-full p-2">{extra}</div>),
        toNullable
      )}
    </div>
  );
};

const NewRecipeItem: React.FC<{
  ingredients: Ingredient[];
  onAdd: (item: IRecipeItem) => void;
}> = ({ ingredients, onAdd }) => {
  const [ingredient, setIngredient] = useState<Ingredient>();
  const [quantity, setQuantity] = useState<string>("");

  const handleChangeQuantity = useCallback(
    (event: React.ChangeEvent) =>
      setQuantity((event.target as HTMLInputElement).value),
    [setQuantity]
  );

  const quantityAsNumber = Number(quantity);
  const canSubmit = ingredient != null && !isNaN(quantityAsNumber);

  const handleClickAdd = useCallback(() => {
    if (!canSubmit) return;

    onAdd({ ingredientName: ingredient.name, quantity: quantityAsNumber });
  }, [ingredient, quantityAsNumber, canSubmit, onAdd]);

  return (
    <RecipeItemLayout
      name={
        <IngredientPicker
          ingredient={ingredient}
          ingredients={ingredients}
          onChange={setIngredient}
        />
      }
      amount={
        <input
          type="number"
          className="p-2 placeholder-textSecondary"
          min="0"
          placeholder="Quantity"
          onChange={handleChangeQuantity}
        />
      }
      extra={
        <button disabled={!canSubmit} onClick={handleClickAdd}>
          Add
        </button>
      }
    />
  );
};

const RecipeItem: React.FC<{
  item: IRecipeItemAndIngredient;
  onDelete: (item: IRecipeItem) => void;
}> = ({ item, onDelete }) => {
  const handleDelete = useCallback(() => onDelete(item.item), [onDelete, item]);

  //   ╳

  return (
    <RecipeItemLayout
      name={item.ingredient.name}
      amount={item.item.quantity}
      extra={
        <button onClick={handleDelete} aria-label="Remove" title="Remove">
          Remove
        </button>
      }
    />
  );
};

const MissingIngredientRecipeItem: React.FC<{
  item: IRecipeItem;
  onDelete: (item: IRecipeItem) => void;
}> = ({ item, onDelete }) => {
  const handleDelete = useCallback(() => onDelete(item), [onDelete, item]);

  return (
    <div className="p-2 text-red-500">
      Could not find ingredient <em>{item.ingredientName}</em>.{" "}
      <button onClick={handleDelete} aria-label="Remove" title="Remove">
        ╳
      </button>
    </div>
  );
};

export default Recipe;

const NO_INGREDIENTS: Ingredient[] = [];

interface IRecipeItem {
  ingredientName: Ingredient["name"];
  quantity: number;
}

interface IRecipeItemAndIngredient {
  ingredient: Ingredient;
  item: IRecipeItem;
}

const collectIngredients = flow(
  map((ingredient: Ingredient) => [ingredient.name, ingredient] as const),
  fromEntries
);

const findIngredient =
  (ingredientsByName: Record<Ingredient["name"], Ingredient>) =>
  (item: IRecipeItem): Either<IRecipeItem, IRecipeItemAndIngredient> =>
    pipe(
      ingredientsByName,
      lookup(item.ingredientName),
      mapO((ingredient) => ({ ingredient, item })),
      fromOption(() => item)
    );

const findIngredients = (ingredients: Ingredient[], items: IRecipeItem[]) =>
  pipe(
    items,
    mapA(pipe(collectIngredients(ingredients), findIngredient)),
    separate
  );

const calculatePrice = flow(
  reduce(
    0,
    (price: number, { ingredient, item }: IRecipeItemAndIngredient) =>
      price + ingredient.unitPrice * item.quantity
  )
);
