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
import MinusCircleIcon from "@heroicons/react/24/solid/MinusCircleIcon";
import PlusCircleIcon from "@heroicons/react/24/solid/PlusCircleIcon";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const Recipe: React.FC = () => {
  const { data: ingredients = NO_INGREDIENTS, isLoading } = useSWR<
    Ingredient[]
  >("/api/ingredients", fetcher);
  const availableIngredients = useMemo(
    () =>
      ingredients
        .filter(({ available }) => available)
        .sort(({ name: nameA }, { name: nameB }) => nameA.localeCompare(nameB)),
    [ingredients]
  );

  const [items, setItems] = useState<IRecipeItem[]>([]);
  const [newRecipeItemKey, setNewRecipeItemKey] = useState<number>(0);
  const itemsWithIngredients = useMemo(
    () => findIngredients(availableIngredients, items),
    [availableIngredients, items]
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
    (item: IRecipeItem) => {
      setItems((values) =>
        values
          .filter((value) => value.ingredientName !== item.ingredientName)
          .concat(item)
      );
      setNewRecipeItemKey((key) => key + 1);
    },
    [setItems]
  );

  if (isLoading) return <div className="p-2 text-center">Loading...</div>;

  return (
    <div className="flex flex-col">
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

        <NewRecipeItem
          key={`new-recipe-item-${newRecipeItemKey}`}
          ingredients={availableIngredients}
          onAdd={handleAddItem}
        />

        <RecipeItemLayout
          name="Ingredients price"
          amount={priceFormatter.format(price)}
        />

        <RecipeItemLayout
          name="10% Studio charge"
          amount={priceFormatter.format(price * STUDIO_CHARGE)}
        />

        <RecipeItemLayout
          name="5% GST"
          amount={priceFormatter.format(price * GST)}
        />

        <RecipeItemLayout
          name="Total price"
          amount={priceFormatter.format(price * (1 + GST + STUDIO_CHARGE))}
        />
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
  const canSubmit =
    ingredient != null && !isNaN(quantityAsNumber) && quantityAsNumber > 0;

  const handleSubmit = useCallback(
    (event: React.SyntheticEvent) => {
      event.preventDefault();

      if (!canSubmit) return;

      onAdd({ ingredientName: ingredient.name, quantity: quantityAsNumber });
    },
    [ingredient, quantityAsNumber, canSubmit, onAdd]
  );

  return (
    <form onSubmit={handleSubmit}>
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
            className="p-2 placeholder-textSecondary text-right rounded-md"
            min="0"
            placeholder="Quantity"
            onChange={handleChangeQuantity}
          />
        }
        extra={
          <button
            disabled={!canSubmit}
            className={canSubmit ? "cursor-pointer" : "cursor-not-allowed"}
          >
            <PlusCircleIcon className="w-6" />
          </button>
        }
      />
    </form>
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
      name={
        <span>
          <span className="font-bold">{item.ingredient.name}</span>{" "}
          {item.item.quantity}g
        </span>
      }
      amount={priceFormatter.format(getItemPrice(item))}
      extra={
        <button onClick={handleDelete} aria-label="Remove" title="Remove">
          <MinusCircleIcon className="w-6" />
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
        <MinusCircleIcon className="w-6" />
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
    (price: number, item: IRecipeItemAndIngredient) =>
      price + getItemPrice(item)
  )
);

const priceFormatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
});

const getItemPrice = ({ ingredient, item }: IRecipeItemAndIngredient) =>
  (ingredient.packPrice / ingredient.packQuantity) * item.quantity;

const STUDIO_CHARGE = 0.1;
const GST = 0.05;
